import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";
import {
  users, schedules, exercises, clientSchedules, completions,
  type User, type InsertUser,
  type Schedule, type InsertSchedule,
  type Exercise, type InsertExercise,
  type ClientSchedule, type InsertClientSchedule,
  type Completion, type InsertCompletion,
} from "@shared/schema";

const dbPath = process.env.NODE_ENV === "production" ? "/tmp/a7medfit.db" : "a7medfit.db";
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    avatar_initials TEXT
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    coach_id INTEGER NOT NULL,
    client_id INTEGER,
    week_start TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    assigned_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

export interface IStorage {
  // Users
  createUser(data: InsertUser): User;
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getAllClients(): User[];
  updateUserAvatar(id: number, initials: string): User | undefined;

  // Schedules
  createSchedule(data: InsertSchedule): Schedule;
  getScheduleById(id: number): Schedule | undefined;
  getSchedulesByCoach(coachId: number): Schedule[];
  getSchedulesForClient(clientId: number): Schedule[];
  updateSchedule(id: number, data: Partial<InsertSchedule>): Schedule | undefined;
  deleteSchedule(id: number): void;

  // Exercises
  createExercise(data: InsertExercise): Exercise;
  getExerciseById(id: number): Exercise | undefined;
  getExercisesBySchedule(scheduleId: number): Exercise[];
  updateExercise(id: number, data: Partial<InsertExercise>): Exercise | undefined;
  deleteExercise(id: number): void;

  // Client assignments
  assignClientToSchedule(data: InsertClientSchedule): ClientSchedule;
  unassignClientFromSchedule(clientId: number, scheduleId: number): void;
  getClientAssignments(scheduleId: number): ClientSchedule[];
  getClientScheduleIds(clientId: number): number[];

  // Completions
  createCompletion(data: InsertCompletion): Completion;
  getCompletionsByClient(clientId: number): Completion[];
  getCompletionsBySchedule(scheduleId: number): Completion[];
  getCompletionsByExercise(exerciseId: number): Completion[];
  getCompletionByClientAndExercise(clientId: number, exerciseId: number): Completion | undefined;
  getAllCompletions(): Completion[];
}

export const storage: IStorage = {
  // Users
  createUser(data) {
    const initials = data.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return db.insert(users).values({ ...data, avatarInitials: initials }).returning().get();
  },
  getUserById(id) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },
  getUserByEmail(email) {
    return db.select().from(users).where(eq(users.email, email)).get();
  },
  getAllClients() {
    return db.select().from(users).where(eq(users.role, "client")).all();
  },
  updateUserAvatar(id, initials) {
    return db.update(users).set({ avatarInitials: initials }).where(eq(users.id, id)).returning().get();
  },

  // Schedules
  createSchedule(data) {
    return db.insert(schedules).values(data).returning().get();
  },
  getScheduleById(id) {
    return db.select().from(schedules).where(eq(schedules.id, id)).get();
  },
  getSchedulesByCoach(coachId) {
    return db.select().from(schedules).where(eq(schedules.coachId, coachId)).all();
  },
  getSchedulesForClient(clientId) {
    const ids = storage.getClientScheduleIds(clientId);
    if (ids.length === 0) return [];
    return db.select().from(schedules).all().filter((s) => ids.includes(s.id));
  },
  updateSchedule(id, data) {
    return db.update(schedules).set(data).where(eq(schedules.id, id)).returning().get();
  },
  deleteSchedule(id) {
    db.delete(schedules).where(eq(schedules.id, id)).run();
  },

  // Exercises
  createExercise(data) {
    return db.insert(exercises).values(data).returning().get();
  },
  getExerciseById(id) {
    return db.select().from(exercises).where(eq(exercises.id, id)).get();
  },
  getExercisesBySchedule(scheduleId) {
    return db.select().from(exercises).where(eq(exercises.scheduleId, scheduleId)).all();
  },
  updateExercise(id, data) {
    return db.update(exercises).set(data).where(eq(exercises.id, id)).returning().get();
  },
  deleteExercise(id) {
    db.delete(exercises).where(eq(exercises.id, id)).run();
  },

  // Client assignments
  assignClientToSchedule(data) {
    return db.insert(clientSchedules).values(data).returning().get();
  },
  unassignClientFromSchedule(clientId, scheduleId) {
    db.delete(clientSchedules)
      .where(and(eq(clientSchedules.clientId, clientId), eq(clientSchedules.scheduleId, scheduleId)))
      .run();
  },
  getClientAssignments(scheduleId) {
    return db.select().from(clientSchedules).where(eq(clientSchedules.scheduleId, scheduleId)).all();
  },
  getClientScheduleIds(clientId) {
    return db
      .select()
      .from(clientSchedules)
      .where(eq(clientSchedules.clientId, clientId))
      .all()
      .map((cs) => cs.scheduleId);
  },

  // Completions
  createCompletion(data) {
    return db.insert(completions).values(data).returning().get();
  },
  getCompletionsByClient(clientId) {
    return db.select().from(completions).where(eq(completions.clientId, clientId)).all();
  },
  getCompletionsBySchedule(scheduleId) {
    return db.select().from(completions).where(eq(completions.scheduleId, scheduleId)).all();
  },
  getCompletionsByExercise(exerciseId) {
    return db.select().from(completions).where(eq(completions.exerciseId, exerciseId)).all();
  },
  getCompletionByClientAndExercise(clientId, exerciseId) {
    return db
      .select()
      .from(completions)
      .where(and(eq(completions.clientId, clientId), eq(completions.exerciseId, exerciseId)))
      .get();
  },
  getAllCompletions() {
    return db.select().from(completions).all();
  },
};
