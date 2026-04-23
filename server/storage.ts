import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import {
  users, schedules, exercises, clientSchedules, completions,
  type User, type InsertUser,
  type Schedule, type InsertSchedule,
  type Exercise, type InsertExercise,
  type ClientSchedule, type InsertClientSchedule,
  type Completion, type InsertCompletion,
} from "@shared/schema";

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com") || process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool);

// Initialize tables (create if not exist)
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        avatar_initials TEXT
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        coach_id INTEGER NOT NULL,
        client_id INTEGER,
        week_start TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        day_of_week INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        sets INTEGER,
        reps INTEGER,
        duration_seconds INTEGER,
        notes TEXT,
        video_url TEXT,
        video_filename TEXT
      );
      CREATE TABLE IF NOT EXISTS client_schedules (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        schedule_id INTEGER NOT NULL,
        assigned_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS completions (
        id SERIAL PRIMARY KEY,
        exercise_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        schedule_id INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        actual_sets INTEGER,
        actual_reps INTEGER,
        actual_weight REAL,
        notes TEXT,
        rating INTEGER
      );
    `);
    console.log("Database tables initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database tables:", err);
  } finally {
    client.release();
  }
}

// Run init immediately
initDb().catch(console.error);

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllClients(): Promise<User[]>;
  updateUserAvatar(id: number, initials: string): Promise<User | undefined>;

  // Schedules
  createSchedule(data: InsertSchedule): Promise<Schedule>;
  getScheduleById(id: number): Promise<Schedule | undefined>;
  getSchedulesByCoach(coachId: number): Promise<Schedule[]>;
  getSchedulesForClient(clientId: number): Promise<Schedule[]>;
  updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<void>;

  // Exercises
  createExercise(data: InsertExercise): Promise<Exercise>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  getExercisesBySchedule(scheduleId: number): Promise<Exercise[]>;
  updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;

  // Client assignments
  assignClientToSchedule(data: InsertClientSchedule): Promise<ClientSchedule>;
  unassignClientFromSchedule(clientId: number, scheduleId: number): Promise<void>;
  getClientAssignments(scheduleId: number): Promise<ClientSchedule[]>;
  getClientScheduleIds(clientId: number): Promise<number[]>;

  // Completions
  createCompletion(data: InsertCompletion): Promise<Completion>;
  getCompletionsByClient(clientId: number): Promise<Completion[]>;
  getCompletionsBySchedule(scheduleId: number): Promise<Completion[]>;
  getCompletionsByExercise(exerciseId: number): Promise<Completion[]>;
  getCompletionByClientAndExercise(clientId: number, exerciseId: number): Promise<Completion | undefined>;
  getAllCompletions(): Promise<Completion[]>;
}

export const storage: IStorage = {
  // Users
  async createUser(data) {
    const initials = data.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const result = await db.insert(users).values({ ...data, avatarInitials: initials }).returning();
    return result[0];
  },
  async getUserById(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  },
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  },
  async getAllClients() {
    return db.select().from(users).where(eq(users.role, "client"));
  },
  async updateUserAvatar(id, initials) {
    const result = await db.update(users).set({ avatarInitials: initials }).where(eq(users.id, id)).returning();
    return result[0];
  },

  // Schedules
  async createSchedule(data) {
    const result = await db.insert(schedules).values(data).returning();
    return result[0];
  },
  async getScheduleById(id) {
    const result = await db.select().from(schedules).where(eq(schedules.id, id));
    return result[0];
  },
  async getSchedulesByCoach(coachId) {
    return db.select().from(schedules).where(eq(schedules.coachId, coachId));
  },
  async getSchedulesForClient(clientId) {
    const ids = await storage.getClientScheduleIds(clientId);
    if (ids.length === 0) return [];
    const all = await db.select().from(schedules);
    return all.filter((s) => ids.includes(s.id));
  },
  async updateSchedule(id, data) {
    const result = await db.update(schedules).set(data).where(eq(schedules.id, id)).returning();
    return result[0];
  },
  async deleteSchedule(id) {
    await db.delete(schedules).where(eq(schedules.id, id));
  },

  // Exercises
  async createExercise(data) {
    const result = await db.insert(exercises).values(data).returning();
    return result[0];
  },
  async getExerciseById(id) {
    const result = await db.select().from(exercises).where(eq(exercises.id, id));
    return result[0];
  },
  async getExercisesBySchedule(scheduleId) {
    return db.select().from(exercises).where(eq(exercises.scheduleId, scheduleId));
  },
  async updateExercise(id, data) {
    const result = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
    return result[0];
  },
  async deleteExercise(id) {
    await db.delete(exercises).where(eq(exercises.id, id));
  },

  // Client assignments
  async assignClientToSchedule(data) {
    const result = await db.insert(clientSchedules).values(data).returning();
    return result[0];
  },
  async unassignClientFromSchedule(clientId, scheduleId) {
    await db.delete(clientSchedules)
      .where(and(eq(clientSchedules.clientId, clientId), eq(clientSchedules.scheduleId, scheduleId)));
  },
  async getClientAssignments(scheduleId) {
    return db.select().from(clientSchedules).where(eq(clientSchedules.scheduleId, scheduleId));
  },
  async getClientScheduleIds(clientId) {
    const result = await db.select().from(clientSchedules).where(eq(clientSchedules.clientId, clientId));
    return result.map((cs) => cs.scheduleId);
  },

  // Completions
  async createCompletion(data) {
    const result = await db.insert(completions).values(data).returning();
    return result[0];
  },
  async getCompletionsByClient(clientId) {
    return db.select().from(completions).where(eq(completions.clientId, clientId));
  },
  async getCompletionsBySchedule(scheduleId) {
    return db.select().from(completions).where(eq(completions.scheduleId, scheduleId));
  },
  async getCompletionsByExercise(exerciseId) {
    return db.select().from(completions).where(eq(completions.exerciseId, exerciseId));
  },
  async getCompletionByClientAndExercise(clientId, exerciseId) {
    const result = await db.select().from(completions)
      .where(and(eq(completions.clientId, clientId), eq(completions.exerciseId, exerciseId)));
    return result[0];
  },
  async getAllCompletions() {
    return db.select().from(completions);
  },
};
