import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertHabitSchema, insertHabitCompletionSchema, insertFollowSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Habits API
  app.get("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const habits = await storage.getHabitsByUserId(userId);
      
      // Get today's completions to mark habits as completed or not
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completions = await storage.getHabitCompletionsByDate(userId, today);
      const completedHabitIds = completions.map(c => c.habitId);
      
      // Calculate streaks for each habit
      const habitsWithStatus = await Promise.all(habits.map(async (habit) => {
        const streak = await storage.getHabitStreak(habit.id);
        return {
          ...habit,
          isCompleted: completedHabitIds.includes(habit.id),
          streak
        };
      }));
      
      res.json(habitsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const validatedData = insertHabitSchema.parse({
        ...req.body,
        userId
      });
      
      const habit = await storage.createHabit(validatedData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const habitId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if habit belongs to user
      const habit = await storage.getHabitById(habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      await storage.deleteHabit(habitId);
      res.status(200).json({ message: "Habit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Habit Completions API
  app.post("/api/habit-completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const validatedData = insertHabitCompletionSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if habit belongs to user
      const habit = await storage.getHabitById(validatedData.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      // Check if already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingCompletion = await storage.getHabitCompletionByDate(
        validatedData.habitId,
        userId,
        today
      );
      
      if (existingCompletion) {
        // If already completed, delete the completion (toggle functionality)
        await storage.deleteHabitCompletion(existingCompletion.id);
        res.status(200).json({ message: "Habit completion removed", completed: false });
      } else {
        // Otherwise, add a new completion
        const completion = await storage.createHabitCompletion(validatedData);
        const streak = await storage.getHabitStreak(validatedData.habitId);
        res.status(201).json({ 
          ...completion,
          streak,
          completed: true
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update habit completion" });
    }
  });

  // User Stats API
  app.get("/api/user-stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Get the longest streak across all habits
      const currentStreak = await storage.getUserCurrentStreak(userId);
      
      // Get today's completion rate
      const habits = await storage.getHabitsByUserId(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completions = await storage.getHabitCompletionsByDate(userId, today);
      
      const todayTotal = habits.length;
      const todayCompleted = completions.length;
      const todayCompletionRate = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
      
      // Get monthly completion rate
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyCompletions = await storage.getMonthlyCompletionRate(userId);
      
      res.json({
        currentStreak,
        todayCompletionRate,
        todayCompleted,
        todayTotal,
        monthlyCompletionRate: monthlyCompletions.rate,
        monthlyCompletedDays: monthlyCompletions.completedDays,
        monthlyTotalDays: monthlyCompletions.totalDays
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Community Feed API
  app.get("/api/activity-feed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const activities = await storage.getActivityFeed(userId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Follow User API
  app.post("/api/follows", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const followerId = req.user!.id;
      const validatedData = insertFollowSchema.parse({
        ...req.body,
        followerId
      });
      
      // Check if already following
      const existingFollow = await storage.getFollowByUserIds(
        validatedData.followerId,
        validatedData.followingId
      );
      
      if (existingFollow) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      const follow = await storage.createFollow(validatedData);
      res.status(201).json(follow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/follows/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.id);
      
      const follow = await storage.getFollowByUserIds(followerId, followingId);
      if (!follow) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }
      
      await storage.deleteFollow(follow.id);
      res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
