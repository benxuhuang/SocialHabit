import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { format } from "date-fns";
import { insertHabitSchema, insertHabitCompletionSchema, insertConnectionSchema, insertInteractionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Habits routes
  app.post("/api/habits", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertHabitSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const habit = await storage.createHabit(validatedData);
      res.status(201).json(habit);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/habits", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habits = await storage.getUserHabitsWithStreaks(req.user.id);
      res.json(habits);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/habits/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.user.id) return res.sendStatus(403);
      
      const streak = await storage.getHabitStreak(habitId);
      const longestStreak = await storage.getHabitLongestStreak(habitId);
      const completions = await storage.getCompletionsForHabit(habitId);
      
      res.json({
        ...habit,
        streak,
        longestStreak,
        completions
      });
    } catch (err) {
      next(err);
    }
  });
  
  app.put("/api/habits/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.user.id) return res.sendStatus(403);
      
      const validatedData = insertHabitSchema
        .omit({ userId: true })
        .partial()
        .parse(req.body);
      
      const updatedHabit = await storage.updateHabit(habitId, validatedData);
      res.json(updatedHabit);
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/habits/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.user.id) return res.sendStatus(403);
      
      await storage.deleteHabit(habitId);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });
  
  // Habit completions routes
  app.post("/api/habits/:id/complete", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.user.id) return res.sendStatus(403);
      
      // Default to today if no date provided
      const date = req.body.date || format(new Date(), 'yyyy-MM-dd');
      
      const validatedData = insertHabitCompletionSchema.parse({
        habitId,
        userId: req.user.id,
        date
      });
      
      const completion = await storage.completeHabit(validatedData);
      
      // Get updated streak
      const streak = await storage.getHabitStreak(habitId);
      
      res.status(201).json({ 
        ...completion,
        streak
      });
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/habits/:id/complete", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.user.id) return res.sendStatus(403);
      
      // Default to today if no date provided
      const date = req.query.date as string || format(new Date(), 'yyyy-MM-dd');
      
      await storage.uncompleteHabit(habitId, date);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });
  
  // Social routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Get all users except current user, don't expose passwords
      const users = Array.from(await storage["users"].values())
        .filter(user => user.id !== req.user.id)
        .map(({ password, ...user }) => user);
      
      res.json(users);
    } catch (err) {
      next(err);
    }
  });
  
  app.post("/api/follow", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertConnectionSchema.parse({
        followerId: req.user.id,
        followingId: req.body.followingId
      });
      
      const connection = await storage.followUser(validatedData);
      res.status(201).json(connection);
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/follow/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const followingId = parseInt(req.params.id);
      await storage.unfollowUser(req.user.id, followingId);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/following", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const following = await storage.getFollowing(req.user.id);
      res.json(following.map(({ password, ...user }) => user));
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/followers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const followers = await storage.getFollowers(req.user.id);
      res.json(followers.map(({ password, ...user }) => user));
    } catch (err) {
      next(err);
    }
  });
  
  // Activity feed
  app.get("/api/feed", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const feed = await storage.getFriendActivityFeed(req.user.id, limit);
      
      // Remove passwords from users
      const sanitizedFeed = feed.map(item => ({
        ...item,
        user: {
          ...item.user,
          password: undefined
        }
      }));
      
      res.json(sanitizedFeed);
    } catch (err) {
      next(err);
    }
  });
  
  // Support interactions
  app.post("/api/support", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertInteractionSchema.parse({
        fromUserId: req.user.id,
        toCompletionId: req.body.completionId,
        type: "support"
      });
      
      const interaction = await storage.supportCompletion(validatedData);
      res.status(201).json(interaction);
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/support/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const completionId = parseInt(req.params.id);
      await storage.unsupportCompletion(req.user.id, completionId);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });
  
  // Stats
  app.get("/api/stats", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      
      // Get weekly completion rate
      const completionRate = await storage.getUserCompletionRate(req.user.id, days);
      
      // Get all habits with streaks
      const habitsWithStreaks = await storage.getUserHabitsWithStreaks(req.user.id);
      
      // Find habit with longest streak
      const longestStreakHabit = habitsWithStreaks.reduce(
        (longest, habit) => habit.longestStreak > longest.longestStreak ? habit : longest,
        { longestStreak: 0 }
      );
      
      // Count active habits
      const activeCount = habitsWithStreaks.filter(h => h.active).length;
      const pausedCount = habitsWithStreaks.filter(h => !h.active).length;
      
      res.json({
        completionRate,
        longestStreakHabit,
        habitCounts: {
          active: activeCount,
          paused: pausedCount,
          total: habitsWithStreaks.length
        }
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Create an HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
