import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habits table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#5B5FE3"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habit completions table
export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format
});

// Social connections (following)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey(t.followerId, t.followingId),
}));

// Social interactions (likes/supports)
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toCompletionId: integer("to_completion_id").notNull().references(() => habitCompletions.id, { onDelete: "cascade" }),
  type: text("type").default("support"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for data insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true, createdAt: true });
export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({ id: true, completedAt: true });
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true, createdAt: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true });

// Types for usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

// Extended type for habit with streak
export interface HabitWithStreak extends Habit {
  streak: number;
  longestStreak: number;
  completedToday: boolean;
  completionHistory: string[];
}

// Extended type for social feed
export interface FriendActivity {
  id: number;
  user: User; 
  habit: Habit;
  completion: HabitCompletion;
  supported: boolean;
  streakCount: number;
  timeAgo: string;
}
