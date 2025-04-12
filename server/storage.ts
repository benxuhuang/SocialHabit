import { 
  User, 
  InsertUser, 
  Habit, 
  InsertHabit, 
  HabitCompletion, 
  InsertHabitCompletion,
  Follow,
  InsertFollow,
  ActivityFeedItem
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habit operations
  getHabitsByUserId(userId: number): Promise<Habit[]>;
  getHabitById(id: number): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;
  
  // Habit completion operations
  getHabitCompletionsByDate(userId: number, date: Date): Promise<HabitCompletion[]>;
  getHabitCompletionByDate(habitId: number, userId: number, date: Date): Promise<HabitCompletion | undefined>;
  createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  deleteHabitCompletion(id: number): Promise<void>;
  
  // Streak calculation
  getHabitStreak(habitId: number): Promise<number>;
  getUserCurrentStreak(userId: number): Promise<number>;
  
  // Stats calculations
  getMonthlyCompletionRate(userId: number): Promise<{rate: number, completedDays: number, totalDays: number}>;
  
  // Social operations
  getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(id: number): Promise<void>;
  getActivityFeed(userId: number): Promise<ActivityFeedItem[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private habitCompletions: Map<number, HabitCompletion>;
  private follows: Map<number, Follow>;
  
  private userIdCounter: number;
  private habitIdCounter: number;
  private completionIdCounter: number;
  private followIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.habitCompletions = new Map();
    this.follows = new Map();
    
    this.userIdCounter = 1;
    this.habitIdCounter = 1;
    this.completionIdCounter = 1;
    this.followIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Add some demo data
    this.initializeDemoData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }

  async getHabitById(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = this.habitIdCounter++;
    const habit: Habit = {
      ...insertHabit,
      id,
      createdAt: new Date()
    };
    this.habits.set(id, habit);
    return habit;
  }

  async deleteHabit(id: number): Promise<void> {
    this.habits.delete(id);
    
    // Also delete related completions
    for (const [completionId, completion] of this.habitCompletions.entries()) {
      if (completion.habitId === id) {
        this.habitCompletions.delete(completionId);
      }
    }
  }

  async getHabitCompletionsByDate(userId: number, date: Date): Promise<HabitCompletion[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.habitCompletions.values()).filter(
      (completion) => {
        const completedDate = new Date(completion.completedAt);
        return (
          completion.userId === userId &&
          completedDate >= startOfDay &&
          completedDate <= endOfDay
        );
      }
    );
  }

  async getHabitCompletionByDate(habitId: number, userId: number, date: Date): Promise<HabitCompletion | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.habitCompletions.values()).find(
      (completion) => {
        const completedDate = new Date(completion.completedAt);
        return (
          completion.habitId === habitId &&
          completion.userId === userId &&
          completedDate >= startOfDay &&
          completedDate <= endOfDay
        );
      }
    );
  }

  async createHabitCompletion(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    const id = this.completionIdCounter++;
    const completion: HabitCompletion = {
      ...insertCompletion,
      id,
      completedAt: new Date()
    };
    this.habitCompletions.set(id, completion);
    return completion;
  }

  async deleteHabitCompletion(id: number): Promise<void> {
    this.habitCompletions.delete(id);
  }

  async getHabitStreak(habitId: number): Promise<number> {
    // Get all completions for this habit, sorted by date (newest first)
    const completions = Array.from(this.habitCompletions.values())
      .filter(completion => completion.habitId === habitId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (completions.length === 0) return 0;
    
    let streak = 1;
    let currentDate = new Date(completions[0].completedAt);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if the most recent completion is from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (currentDate.getTime() !== today.getTime() && 
        currentDate.getTime() !== yesterday.getTime()) {
      // If the most recent completion is not from today or yesterday,
      // the streak is broken
      return 0;
    }
    
    // Calculate streak
    for (let i = 1; i < completions.length; i++) {
      const prevDate = new Date(completions[i].completedAt);
      prevDate.setHours(0, 0, 0, 0);
      
      const expectedPrevDate = new Date(currentDate);
      expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
      
      if (prevDate.getTime() === expectedPrevDate.getTime()) {
        // Previous day completed, streak continues
        streak++;
        currentDate = prevDate;
      } else {
        // Gap in streak, we're done
        break;
      }
    }
    
    return streak;
  }

  async getUserCurrentStreak(userId: number): Promise<number> {
    const habits = await this.getHabitsByUserId(userId);
    
    if (habits.length === 0) return 0;
    
    // Get the streak for each habit
    const streaks = await Promise.all(
      habits.map(habit => this.getHabitStreak(habit.id))
    );
    
    // Return the max streak
    return Math.max(...streaks);
  }

  async getMonthlyCompletionRate(userId: number): Promise<{rate: number, completedDays: number, totalDays: number}> {
    const habits = await this.getHabitsByUserId(userId);
    
    if (habits.length === 0) {
      return { rate: 0, completedDays: 0, totalDays: 0 };
    }
    
    // Get start of month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get all days in the month up to today
    const daysDiff = Math.floor((today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get all completions for this user in the current month
    const allCompletions = Array.from(this.habitCompletions.values())
      .filter(completion => {
        const completedDate = new Date(completion.completedAt);
        return (
          completion.userId === userId &&
          completedDate >= startOfMonth &&
          completedDate <= today
        );
      });
    
    // Get unique dates with at least one completion
    const completedDates = new Set(
      allCompletions.map(completion => {
        const date = new Date(completion.completedAt);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    
    const completedDays = completedDates.size;
    const rate = (completedDays / daysDiff) * 100;
    
    return {
      rate,
      completedDays,
      totalDays: daysDiff
    };
  }

  async getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values()).find(
      (follow) => 
        follow.followerId === followerId && 
        follow.followingId === followingId
    );
  }

  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const id = this.followIdCounter++;
    const follow: Follow = {
      ...insertFollow,
      id,
      createdAt: new Date()
    };
    this.follows.set(id, follow);
    return follow;
  }

  async deleteFollow(id: number): Promise<void> {
    this.follows.delete(id);
  }

  async getActivityFeed(userId: number): Promise<ActivityFeedItem[]> {
    // Get users that the current user follows
    const following = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
      
    // Add current user to the list to include their own activities
    following.push(userId);
    
    // Get all completions from followed users, sorted by date (newest first)
    const recentCompletions = Array.from(this.habitCompletions.values())
      .filter(completion => following.includes(completion.userId))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10); // Limit to 10 most recent activities
    
    // Build activity feed items with user and habit details
    const activityItems: ActivityFeedItem[] = await Promise.all(
      recentCompletions.map(async completion => {
        const user = await this.getUser(completion.userId);
        const habit = await this.getHabitById(completion.habitId);
        const streak = await this.getHabitStreak(completion.habitId);
        
        if (!user || !habit) {
          throw new Error("User or habit not found");
        }
        
        return {
          id: completion.id,
          user,
          habit,
          completedAt: new Date(completion.completedAt),
          streak
        };
      })
    );
    
    return activityItems;
  }

  private async initializeDemoData() {
    // This is just to have some data to show when testing
    // In a real app, we would remove this
    if (process.env.NODE_ENV === 'development') {
      // Create demo user
      const demoUser = await this.createUser({
        username: 'demo',
        password: '$2b$10$zQF4nSjDwWwA3OzJKfR8Fu9uEOZ6XlgJzgYS6O8xZUJCF7BKI1D7O', // "password"
        displayName: 'Demo User',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80'
      });

      // Create demo habits
      await this.createHabit({
        userId: demoUser.id,
        title: 'Morning meditation',
        description: '10 minutes'
      });

      await this.createHabit({
        userId: demoUser.id,
        title: 'Read for 30 minutes',
        description: 'Personal development'
      });

      await this.createHabit({
        userId: demoUser.id,
        title: 'Drink 2L of water',
        description: 'Stay hydrated'
      });

      await this.createHabit({
        userId: demoUser.id,
        title: 'Exercise for 30 minutes',
        description: 'Cardio or strength'
      });

      await this.createHabit({
        userId: demoUser.id,
        title: 'Write in journal',
        description: 'Evening reflection'
      });
    }
  }
}

export const storage = new MemStorage();
