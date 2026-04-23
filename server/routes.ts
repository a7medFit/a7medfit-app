import type { Express, Request, Response } from "express";
import type { Server } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertUserSchema, insertScheduleSchema, insertExerciseSchema, insertCompletionSchema } from "@shared/schema";
import { z } from "zod";

const MemoryStore = createMemoryStore(session);

// Multer setup for video uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files allowed"));
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Session + Passport setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "a7medfit-secret-2026",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      const user = storage.getUserByEmail(email);
      if (!user || user.password !== password) return done(null, false, { message: "Invalid credentials" });
      return done(null, user);
    })
  );
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser((id: number, done) => {
    const user = storage.getUserById(id);
    done(null, user || false);
  });

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Unauthorized" });
  };
  const requireCoach = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === "coach") return next();
    res.status(403).json({ error: "Coach access required" });
  };

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const existing = storage.getUserByEmail(parsed.data.email);
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const user = storage.createUser(parsed.data);
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Login error" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password: _, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  // ─── USERS ─────────────────────────────────────────────────────────────────
  app.get("/api/clients", requireCoach, (_req, res) => {
    const clients = storage.getAllClients().map(({ password: _, ...u }) => u);
    res.json(clients);
  });

  // ─── SCHEDULES ─────────────────────────────────────────────────────────────
  app.get("/api/schedules", requireAuth, (req, res) => {
    const user = req.user as any;
    if (user.role === "coach") {
      const s = storage.getSchedulesByCoach(user.id);
      res.json(s);
    } else {
      const s = storage.getSchedulesForClient(user.id);
      res.json(s);
    }
  });

  app.get("/api/schedules/:id", requireAuth, (req, res) => {
    const s = storage.getScheduleById(Number(req.params.id));
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  });

  app.post("/api/schedules", requireCoach, (req, res) => {
    const user = req.user as any;
    const parsed = insertScheduleSchema.safeParse({ ...req.body, coachId: user.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(storage.createSchedule(parsed.data));
  });

  app.patch("/api/schedules/:id", requireCoach, (req, res) => {
    const updated = storage.updateSchedule(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/schedules/:id", requireCoach, (req, res) => {
    storage.deleteSchedule(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── EXERCISES ─────────────────────────────────────────────────────────────
  app.get("/api/schedules/:id/exercises", requireAuth, (req, res) => {
    res.json(storage.getExercisesBySchedule(Number(req.params.id)));
  });

  app.post("/api/schedules/:id/exercises", requireCoach, upload.single("video"), (req, res) => {
    const body = { ...req.body, scheduleId: Number(req.params.id) };
    if (req.file) {
      body.videoUrl = `/api/videos/${req.file.filename}`;
      body.videoFilename = req.file.originalname;
    }
    // Coerce numbers
    if (body.sets) body.sets = parseInt(body.sets);
    if (body.reps) body.reps = parseInt(body.reps);
    if (body.durationSeconds) body.durationSeconds = parseInt(body.durationSeconds);
    if (body.dayOfWeek !== undefined) body.dayOfWeek = parseInt(body.dayOfWeek);
    if (body.orderIndex !== undefined) body.orderIndex = parseInt(body.orderIndex);

    const parsed = insertExerciseSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(storage.createExercise(parsed.data));
  });

  app.patch("/api/exercises/:id", requireCoach, upload.single("video"), (req, res) => {
    const body = { ...req.body };
    if (req.file) {
      body.videoUrl = `/api/videos/${req.file.filename}`;
      body.videoFilename = req.file.originalname;
    }
    if (body.sets) body.sets = parseInt(body.sets);
    if (body.reps) body.reps = parseInt(body.reps);
    if (body.durationSeconds) body.durationSeconds = parseInt(body.durationSeconds);
    const updated = storage.updateExercise(Number(req.params.id), body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/exercises/:id", requireCoach, (req, res) => {
    storage.deleteExercise(Number(req.params.id));
    res.json({ success: true });
  });

  // Video streaming
  app.get("/api/videos/:filename", requireAuth, (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Video not found" });
    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Length": stat.size, "Content-Type": "video/mp4" });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // ─── CLIENT ASSIGNMENTS ────────────────────────────────────────────────────
  app.get("/api/schedules/:id/clients", requireCoach, (req, res) => {
    const assignments = storage.getClientAssignments(Number(req.params.id));
    const clients = assignments.map((a) => {
      const u = storage.getUserById(a.clientId);
      if (!u) return null;
      const { password: _, ...safe } = u;
      return { ...a, user: safe };
    }).filter(Boolean);
    res.json(clients);
  });

  app.post("/api/schedules/:id/clients", requireCoach, (req, res) => {
    const { clientId } = req.body;
    const existing = storage.getClientAssignments(Number(req.params.id));
    if (existing.find((a) => a.clientId === clientId)) {
      return res.status(409).json({ error: "Already assigned" });
    }
    const a = storage.assignClientToSchedule({
      clientId: Number(clientId),
      scheduleId: Number(req.params.id),
      assignedAt: new Date().toISOString(),
    });
    res.json(a);
  });

  app.delete("/api/schedules/:id/clients/:clientId", requireCoach, (req, res) => {
    storage.unassignClientFromSchedule(Number(req.params.clientId), Number(req.params.id));
    res.json({ success: true });
  });

  // ─── COMPLETIONS ───────────────────────────────────────────────────────────
  app.get("/api/completions", requireAuth, (req, res) => {
    const user = req.user as any;
    if (user.role === "coach") {
      res.json(storage.getAllCompletions());
    } else {
      res.json(storage.getCompletionsByClient(user.id));
    }
  });

  app.get("/api/schedules/:id/completions", requireAuth, (req, res) => {
    res.json(storage.getCompletionsBySchedule(Number(req.params.id)));
  });

  app.post("/api/completions", requireAuth, (req, res) => {
    const user = req.user as any;
    const body = {
      ...req.body,
      clientId: user.id,
      completedAt: new Date().toISOString(),
    };
    if (body.actualSets) body.actualSets = parseInt(body.actualSets);
    if (body.actualReps) body.actualReps = parseInt(body.actualReps);
    if (body.actualWeight) body.actualWeight = parseFloat(body.actualWeight);
    if (body.rating) body.rating = parseInt(body.rating);

    const parsed = insertCompletionSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(storage.createCompletion(parsed.data));
  });

  // ─── COACH PROGRESS OVERVIEW ───────────────────────────────────────────────
  app.get("/api/coach/progress", requireCoach, (req, res) => {
    const user = req.user as any;
    const mySchedules = storage.getSchedulesByCoach(user.id);
    const clients = storage.getAllClients();
    const allCompletions = storage.getAllCompletions();

    const result = clients.map((client) => {
      const { password: _, ...safeClient } = client;
      const clientScheduleIds = storage.getClientScheduleIds(client.id);
      const clientCompletions = allCompletions.filter((c) => c.clientId === client.id);

      const scheduleProgress = clientScheduleIds
        .map((sid) => {
          const sched = storage.getScheduleById(sid);
          if (!sched) return null;
          const exs = storage.getExercisesBySchedule(sid);
          const done = clientCompletions.filter((c) => c.scheduleId === sid).length;
          return {
            schedule: sched,
            totalExercises: exs.length,
            completedExercises: done,
            percent: exs.length > 0 ? Math.round((done / exs.length) * 100) : 0,
          };
        })
        .filter(Boolean);

      return {
        client: safeClient,
        totalCompletions: clientCompletions.length,
        scheduleProgress,
      };
    });

    res.json(result);
  });
}
