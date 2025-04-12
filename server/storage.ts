import { connections, habitCompletions, habits, insertConnectionSchema, insertHabitCompletionSchema, insertHabitSchema, insertInteractionSchema, insertUserSchema, interactions, type Connection, type Habit, type HabitCompletion, type InsertConnection, type InsertHabit, type InsertHabitCompletion, type InsertInteraction, type InsertUser, type Interaction, type User } from "@shared/schema";
import { format, subDays, differenceInDays, parseISO } from "date-fns";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habit methods
  createHabit(habit: InsertHabit): Promise<Habit>;
  getUserHabits(userId: number): Promise<Habit[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;
  
  // Habit completion methods
  completeHabit(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  uncompleteHabit(habitId: number, date: string): Promise<boolean>;
  getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]>;
  getCompletionsForUser(userId: number, date?: string): Promise<HabitCompletion[]>;
  getHabitStreak(habitId: number): Promise<number>;
  getHabitLongestStreak(habitId: number): Promise<number>;
  
  // Social methods
  followUser(connection: InsertConnection): Promise<Connection>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  
  // Interaction methods
  supportCompletion(interaction: InsertInteraction): Promise<Interaction>;
  unsupportCompletion(fromUserId: number, toCompletionId: number): Promise<boolean>;
  isSupporting(fromUserId: number, toCompletionId: number): Promise<boolean>;
  
  // Social feed
  getFriendActivityFeed(userId: number, limit?: number): Promise<any[]>;
  
  // Statistics
  getUserCompletionRate(userId: number, days?: number): Promise<number>;
  getUserHabitsWithStreaks(userId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private completions: Map<number, HabitCompletion>;
  private followConnections: Map<number, Connection>;
  private interactions: Map<number, Interaction>;
  
  private userIdCounter: number;
  private habitIdCounter: number;
  private completionIdCounter: number;
  private connectionIdCounter: number;
  private interactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.completions = new Map();
    this.followConnections = new Map();
    this.interactions = new Map();
    
    this.userIdCounter = 1;
    this.habitIdCounter = 1;
    this.completionIdCounter = 1;
    this.connectionIdCounter = 1;
    this.interactionIdCounter = 1;
    
    // Add some initial seed data for faster testing
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
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
  
  // Habit methods
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
  
  async getUserHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values())
      .filter(habit => habit.userId === userId);
  }
  
  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }
  
  async updateHabit(id: number, habitUpdate: Partial<InsertHabit>): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit = { ...habit, ...habitUpdate };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }
  
  async deleteHabit(id: number): Promise<boolean> {
    return this.habits.delete(id);
  }
  
  // Habit completion methods
  async completeHabit(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    // Check if already completed for this date
    const existing = Array.from(this.completions.values()).find(
      c => c.habitId === insertCompletion.habitId && c.date === insertCompletion.date
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.completionIdCounter++;
    const completion: HabitCompletion = { 
      ...insertCompletion, 
      id,
      completedAt: new Date() 
    };
    this.completions.set(id, completion);
    return completion;
  }
  
  async uncompleteHabit(habitId: number, date: string): Promise<boolean> {
    const completion = Array.from(this.completions.values()).find(
      c => c.habitId === habitId && c.date === date
    );
    
    if (!completion) return false;
    return this.completions.delete(completion.id);
  }
  
  async getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]> {
    return Array.from(this.completions.values())
      .filter(completion => completion.habitId === habitId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async getCompletionsForUser(userId: number, date?: string): Promise<HabitCompletion[]> {
    let completions = Array.from(this.completions.values())
      .filter(completion => completion.userId === userId);
      
    if (date) {
      completions = completions.filter(c => c.date === date);
    }
    
    return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }
  
  async getHabitStreak(habitId: number): Promise<number> {
    const completions = await this.getCompletionsForHabit(habitId);
    if (completions.length === 0) return 0;
    
    // Sort completions by date (newest first)
    completions.sort((a, b) => b.date.localeCompare(a.date));
    
    const today = format(new Date(), 'yyyy-MM-dd');
    let currentDate = today;
    let streak = 0;
    
    // Check if today is completed
    const todayCompleted = completions.some(c => c.date === today);
    if (!todayCompleted) {
      // Check if yesterday was completed
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const yesterdayCompleted = completions.some(c => c.date === yesterday);
      if (!yesterdayCompleted) return 0;
      
      currentDate = yesterday;
    }
    
    // Calculate streak by checking consecutive days
    let dateToCheck = parseISO(currentDate);
    let datesChecked = new Set<string>();
    
    while (true) {
      const formattedDate = format(dateToCheck, 'yyyy-MM-dd');
      if (datesChecked.has(formattedDate)) break;
      
      datesChecked.add(formattedDate);
      const completed = completions.some(c => c.date === formattedDate);
      
      if (!completed) break;
      
      streak++;
      dateToCheck = subDays(dateToCheck, 1);
    }
    
    return streak;
  }
  
  async getHabitLongestStreak(habitId: number): Promise<number> {
    const completions = await this.getCompletionsForHabit(habitId);
    if (completions.length === 0) return 0;
    
    // Sort completions by date
    completions.sort((a, b) => a.date.localeCompare(b.date));
    
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < completions.length; i++) {
      const prevDate = parseISO(completions[i-1].date);
      const currDate = parseISO(completions[i].date);
      
      // Check if dates are consecutive
      if (differenceInDays(currDate, prevDate) === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(maxStreak, currentStreak);
  }
  
  // Social methods
  async followUser(insertConnection: InsertConnection): Promise<Connection> {
    // Check if already following
    const existing = Array.from(this.followConnections.values()).find(
      c => c.followerId === insertConnection.followerId && c.followingId === insertConnection.followingId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.connectionIdCounter++;
    const connection: Connection = { 
      ...insertConnection, 
      id,
      createdAt: new Date() 
    };
    this.followConnections.set(id, connection);
    return connection;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const connection = Array.from(this.followConnections.values()).find(
      c => c.followerId === followerId && c.followingId === followingId
    );
    
    if (!connection) return false;
    return this.followConnections.delete(connection.id);
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.followConnections.values())
      .filter(c => c.followingId === userId)
      .map(c => c.followerId);
    
    return Array.from(this.users.values())
      .filter(user => followerIds.includes(user.id));
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.followConnections.values())
      .filter(c => c.followerId === userId)
      .map(c => c.followingId);
    
    return Array.from(this.users.values())
      .filter(user => followingIds.includes(user.id));
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return Array.from(this.followConnections.values()).some(
      c => c.followerId === followerId && c.followingId === followingId
    );
  }
  
  // Interaction methods
  async supportCompletion(insertInteraction: InsertInteraction): Promise<Interaction> {
    // Check if already supporting
    const existing = Array.from(this.interactions.values()).find(
      i => i.fromUserId === insertInteraction.fromUserId && i.toCompletionId === insertInteraction.toCompletionId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.interactionIdCounter++;
    const interaction: Interaction = { 
      ...insertInteraction, 
      id,
      createdAt: new Date() 
    };
    this.interactions.set(id, interaction);
    return interaction;
  }
  
  async unsupportCompletion(fromUserId: number, toCompletionId: number): Promise<boolean> {
    const interaction = Array.from(this.interactions.values()).find(
      i => i.fromUserId === fromUserId && i.toCompletionId === toCompletionId
    );
    
    if (!interaction) return false;
    return this.interactions.delete(interaction.id);
  }
  
  async isSupporting(fromUserId: number, toCompletionId: number): Promise<boolean> {
    return Array.from(this.interactions.values()).some(
      i => i.fromUserId === fromUserId && i.toCompletionId === toCompletionId
    );
  }
  
  // Social feed
  async getFriendActivityFeed(userId: number, limit: number = 10): Promise<any[]> {
    // Get users being followed
    const following = await this.getFollowing(userId);
    const followingIds = following.map(user => user.id);
    
    // Get completions from those users
    let friendsCompletions: any[] = [];
    
    for (const friendId of followingIds) {
      const completions = await this.getCompletionsForUser(friendId);
      const friendCompletions = await Promise.all(
        completions.map(async (completion) => {
          const habit = await this.getHabit(completion.habitId);
          const user = await this.getUser(friendId);
          const streak = await this.getHabitStreak(completion.habitId);
          const supported = await this.isSupporting(userId, completion.id);
          
          if (!habit || !user) return null;
          
          return {
            id: completion.id,
            user,
            habit,
            completion,
            streakCount: streak,
            supported,
            timeAgo: this.getTimeAgo(completion.completedAt)
          };
        })
      );
      
      friendsCompletions = [...friendsCompletions, ...friendCompletions.filter(Boolean)];
    }
    
    // Sort by completion date (newest first)
    friendsCompletions.sort((a, b) => 
      b.completion.completedAt.getTime() - a.completion.completedAt.getTime()
    );
    
    return friendsCompletions.slice(0, limit);
  }
  
  // Statistics 
  async getUserCompletionRate(userId: number, days: number = 7): Promise<number> {
    const habits = await this.getUserHabits(userId);
    if (habits.length === 0) return 0;
    
    const today = new Date();
    let totalCompletions = 0;
    const daysToCheck = Array.from({ length: days }, (_, i) => 
      format(subDays(today, i), 'yyyy-MM-dd')
    );
    
    const totalPossible = habits.length * daysToCheck.length;
    
    for (const habit of habits) {
      const completions = await this.getCompletionsForHabit(habit.id);
      
      for (const date of daysToCheck) {
        if (completions.some(c => c.date === date)) {
          totalCompletions++;
        }
      }
    }
    
    return totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;
  }
  
  async getUserHabitsWithStreaks(userId: number): Promise<any[]> {
    const habits = await this.getUserHabits(userId);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return Promise.all(
      habits.map(async (habit) => {
        const completions = await this.getCompletionsForHabit(habit.id);
        const streak = await this.getHabitStreak(habit.id);
        const longestStreak = await this.getHabitLongestStreak(habit.id);
        const completedToday = completions.some(c => c.date === today);
        
        // Get last 7 days of completion history
        const last7Days = Array.from({ length: 7 }, (_, i) => 
          format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
        );
        
        const completionHistory = last7Days.map(date => 
          completions.some(c => c.date === date) ? 'completed' : 
            date === today ? 'today' : 'incomplete'
        );
        
        return {
          ...habit,
          streak,
          longestStreak,
          completedToday,
          completionHistory
        };
      })
    );
  }
  
  // Helper method to generate relative time strings
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
  
  // Add some initial data for testing
  private seedData() {
    // This will only run in memory, not when using a database
  }
}

export const storage = new MemStorage();
