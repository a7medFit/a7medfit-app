import { pgTable, text, integer, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (both coach and clients)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // "coach" | "client"
  avatarInitials: text("avatar_initials"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, avatarInitials: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schedules (weekly workout plans)
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id"), // null = assigned to all clients
  weekStart: text("week_start").notNull(), // ISO date string
  status: text("status").notNull().default("active"), // "active" | "draft" | "archived"
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Exercises within a schedule
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun, 1=Mon, ...6=Sat
  orderIndex: integer("order_index").notNull().default(0),
  sets: integer("sets"),
  reps: integer("reps"),
  durationSeconds: integer("duration_seconds"),
  notes: text("notes"),
  videoUrl: text("video_url"), // uploaded file path or external URL
  videoFilename: text("video_filename"),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Client-Schedule assignments
export const clientSchedules = pgTable("client_schedules", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  assignedAt: text("assigned_at").notNull(),
});

export const insertClientScheduleSchema = createInsertSchema(clientSchedules).omit({ id: true });
export type InsertClientSchedule = z.infer<typeof insertClientScheduleSchema>;
export type ClientSchedule = typeof clientSchedules.$inferSelect;

// Exercise completions (client logs)
export const completions = pgTable("completions", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull(),
  clientId: integer("client_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  completedAt: text("completed_at").notNull(),
  actualSets: integer("actual_sets"),
  actualReps: integer("actual_reps"),
  actualWeight: real("actual_weight"), // in kg
  notes: text("notes"),
  rating: integer("rating"), // 1-5 difficulty/effort
});

export const insertCompletionSchema = createInsertSchema(completions).omit({ id: true });
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type Completion = typeof completions.$inferSelect;
