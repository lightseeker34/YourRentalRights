import { 
  users, incidents, incidentLogs, appSettings, contactMessages,
  forumCategories, forumPosts, forumReplies, forumReactions, forumBookmarks, userTrustLevels,
  pdfExports, litigationReviews,
  type User, type InsertUser, type Incident, type InsertIncident, type IncidentLog, type InsertLog, type UpdateProfile, type ContactMessage, type InsertContact,
  type ForumCategory, type InsertForumCategory, type ForumPost, type InsertForumPost, type ForumReply, type InsertForumReply, type ForumReaction, type ForumBookmark, type UserTrustLevel,
  type PdfExport, type LitigationReview
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, asc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateProfile(id: number, profile: UpdateProfile): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  
  // Admin user management
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUserWithAllData(id: number): Promise<void>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  getUserStats(userId: number): Promise<{ incidentCount: number; forumPostCount: number }>;

  createIncident(incident: InsertIncident & { userId: number }): Promise<Incident>;
  getIncidentsByUser(userId: number): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  updateIncident(id: number, updates: { title?: string; description?: string }): Promise<Incident | undefined>;
  updateIncidentStatus(id: number, status: string): Promise<Incident | undefined>;
  deleteIncident(id: number): Promise<void>;
  
  addLog(log: InsertLog): Promise<IncidentLog>;
  getLogsByIncident(incidentId: number): Promise<IncidentLog[]>;
  getLog(id: number): Promise<IncidentLog | undefined>;
  getLogByFileUrl(fileUrl: string): Promise<IncidentLog | undefined>;
  updateLog(id: number, updates: { content?: string; metadata?: any }): Promise<IncidentLog | undefined>;
  deleteLog(id: number): Promise<void>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  getAllSettings(): Promise<{ key: string; value: string }[]>;

  createContactMessage(message: InsertContact): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;

  // Forum methods
  getForumCategories(): Promise<ForumCategory[]>;
  getForumCategory(id: number): Promise<ForumCategory | undefined>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  updateForumCategory(id: number, updates: Partial<InsertForumCategory & { isLocked: boolean }>): Promise<ForumCategory | undefined>;
  deleteForumCategory(id: number): Promise<void>;

  getForumPosts(categoryId?: number, limit?: number, offset?: number, authorId?: number): Promise<{ posts: ForumPost[]; total: number }>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost & { authorId: number }): Promise<ForumPost>;
  updateForumPost(id: number, updates: Partial<{ title: string; content: string; isPinned: boolean; isLocked: boolean; categoryId: number }>): Promise<ForumPost | undefined>;
  deleteForumPost(id: number): Promise<void>;
  incrementPostViewCount(id: number): Promise<void>;

  getForumReplies(postId: number): Promise<ForumReply[]>;
  getForumRepliesByUser(userId: number): Promise<ForumReply[]>;
  getForumReply(id: number): Promise<ForumReply | undefined>;
  createForumReply(reply: InsertForumReply & { authorId: number }): Promise<ForumReply>;
  updateForumReply(id: number, updates: Partial<{ content: string; isAcceptedAnswer: boolean }>): Promise<ForumReply | undefined>;
  deleteForumReply(id: number): Promise<void>;

  getForumReactions(postId?: number, replyId?: number): Promise<ForumReaction[]>;
  toggleForumReaction(userId: number, postId: number | null, replyId: number | null, type: string): Promise<boolean>;

  getForumBookmarks(userId: number): Promise<ForumBookmark[]>;
  toggleForumBookmark(userId: number, postId: number): Promise<boolean>;

  getUserTrustLevel(userId: number): Promise<UserTrustLevel | undefined>;
  getAllUserTrustLevels(): Promise<UserTrustLevel[]>;
  updateUserTrustLevel(userId: number, updates: Partial<UserTrustLevel>): Promise<UserTrustLevel>;
  
  // Analytics
  getAnalytics(days?: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    openCases: number;
    closedCases: number;
    totalEvidence: number;
    aiChats: number;
    forumPosts: number;
    forumReplies: number;
    recentUsers: { date: string; count: number }[];
    recentCases: { date: string; count: number }[];
    periodNewUsers: number;
    periodNewCases: number;
    periodDays: number;
  }>;
  
  // PDF Exports and Litigation Reviews
  createPdfExport(incidentId: number, userId: number): Promise<PdfExport>;
  getPdfExportsByIncident(incidentId: number): Promise<PdfExport[]>;
  getPdfExportCount(): Promise<number>;
  getRecentPdfExports(limit?: number): Promise<(PdfExport & { incident?: Incident; user?: User })[]>;
  
  createLitigationReview(review: Omit<LitigationReview, 'id' | 'createdAt'>): Promise<LitigationReview>;
  getLitigationReview(id: number): Promise<LitigationReview | undefined>;
  getLitigationReviewsByIncident(incidentId: number): Promise<LitigationReview[]>;
  getLitigationReviewCount(): Promise<number>;
  getStrongCaseCount(): Promise<number>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateProfile(id: number, profile: UpdateProfile): Promise<User> {
    const [user] = await db.update(users).set(profile).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result?.count ?? 0;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUserWithAllData(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get all incidents for this user
      const userIncidents = await tx.select().from(incidents).where(eq(incidents.userId, id));
      
      // Delete all incident logs for user's incidents
      for (const incident of userIncidents) {
        await tx.delete(incidentLogs).where(eq(incidentLogs.incidentId, incident.id));
      }
      
      // Delete all incidents
      await tx.delete(incidents).where(eq(incidents.userId, id));
      
      // Delete forum reactions
      await tx.delete(forumReactions).where(eq(forumReactions.userId, id));
      
      // Delete forum bookmarks
      await tx.delete(forumBookmarks).where(eq(forumBookmarks.userId, id));
      
      // Delete forum replies
      await tx.delete(forumReplies).where(eq(forumReplies.authorId, id));
      
      // Delete forum posts
      await tx.delete(forumPosts).where(eq(forumPosts.authorId, id));
      
      // Delete user trust level
      await tx.delete(userTrustLevels).where(eq(userTrustLevels.userId, id));
      
      // Finally delete the user
      await tx.delete(users).where(eq(users.id, id));
    });
    
    // Delete sessions outside transaction (separate connection pool)
    // Use try-catch as session cleanup is optional and shouldn't fail the entire operation
    try {
      await pool.query(`DELETE FROM session WHERE sess::jsonb->>'passport' LIKE $1`, [`%"user":${id}%`]);
    } catch (e) {
      // Session cleanup is best-effort, log but don't fail
      console.log(`Session cleanup for user ${id} skipped:`, e);
    }
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async getUserStats(userId: number): Promise<{ incidentCount: number; forumPostCount: number }> {
    const [incidentResult] = await db.select({ count: count() }).from(incidents).where(eq(incidents.userId, userId));
    const [postResult] = await db.select({ count: count() }).from(forumPosts).where(eq(forumPosts.authorId, userId));
    return {
      incidentCount: incidentResult?.count ?? 0,
      forumPostCount: postResult?.count ?? 0,
    };
  }

  async createIncident(incident: InsertIncident & { userId: number }): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async getIncidentsByUser(userId: number): Promise<Incident[]> {
    return await db.select().from(incidents).where(eq(incidents.userId, userId)).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async updateIncident(id: number, updates: { title?: string; description?: string }): Promise<Incident | undefined> {
    const [incident] = await db.update(incidents).set(updates).where(eq(incidents.id, id)).returning();
    return incident;
  }

  async updateIncidentStatus(id: number, status: string): Promise<Incident | undefined> {
    const [incident] = await db.update(incidents).set({ status }).where(eq(incidents.id, id)).returning();
    return incident;
  }

  async deleteIncident(id: number): Promise<void> {
    await db.delete(incidentLogs).where(eq(incidentLogs.incidentId, id));
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  async addLog(log: InsertLog): Promise<IncidentLog> {
    const [newLog] = await db.insert(incidentLogs).values(log).returning();
    return newLog;
  }

  async getLogsByIncident(incidentId: number): Promise<IncidentLog[]> {
    return await db.select().from(incidentLogs).where(eq(incidentLogs.incidentId, incidentId)).orderBy(asc(incidentLogs.createdAt), asc(incidentLogs.id));
  }

  async getLog(id: number): Promise<IncidentLog | undefined> {
    const [log] = await db.select().from(incidentLogs).where(eq(incidentLogs.id, id));
    return log;
  }

  async getLogByFileUrl(fileUrl: string): Promise<IncidentLog | undefined> {
    const [log] = await db.select().from(incidentLogs).where(eq(incidentLogs.fileUrl, fileUrl));
    return log;
  }

  async updateLog(id: number, updates: { content?: string; metadata?: any }): Promise<IncidentLog | undefined> {
    const [log] = await db.update(incidentLogs).set(updates).where(eq(incidentLogs.id, id)).returning();
    return log;
  }

  async deleteLog(id: number): Promise<void> {
    await db.delete(incidentLogs).where(eq(incidentLogs.id, id));
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing !== undefined) {
      await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(appSettings).where(eq(appSettings.key, key));
  }

  async getAllSettings(): Promise<{ key: string; value: string }[]> {
    return await db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
  }

  async createContactMessage(message: InsertContact): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  // Forum Categories
  async getForumCategories(): Promise<ForumCategory[]> {
    return await db.select().from(forumCategories).orderBy(asc(forumCategories.sortOrder));
  }

  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.id, id));
    return category;
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }

  async updateForumCategory(id: number, updates: Partial<InsertForumCategory & { isLocked: boolean }>): Promise<ForumCategory | undefined> {
    const [category] = await db.update(forumCategories).set(updates).where(eq(forumCategories.id, id)).returning();
    return category;
  }

  async deleteForumCategory(id: number): Promise<void> {
    await db.delete(forumPosts).where(eq(forumPosts.categoryId, id));
    await db.delete(forumCategories).where(eq(forumCategories.id, id));
  }

  // Forum Posts
  async getForumPosts(categoryId?: number, limit?: number, offset?: number, authorId?: number): Promise<{ posts: ForumPost[]; total: number }> {
    const conditions = [];
    if (categoryId) conditions.push(eq(forumPosts.categoryId, categoryId));
    if (authorId) conditions.push(eq(forumPosts.authorId, authorId));
    const whereClause = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? and(...conditions) : undefined;

    let countQuery = db.select({ count: count() }).from(forumPosts);
    if (whereClause) {
      countQuery = countQuery.where(whereClause) as typeof countQuery;
    }
    const [countResult] = await countQuery;
    const total = countResult?.count ?? 0;

    let query = db.select().from(forumPosts);
    if (whereClause) {
      query = query.where(whereClause) as typeof query;
    }
    query = query.orderBy(desc(forumPosts.isPinned), desc(forumPosts.lastActivityAt)) as typeof query;
    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    if (offset) {
      query = query.offset(offset) as typeof query;
    }
    const posts = await query;
    return { posts, total };
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost & { authorId: number }): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    // Update user's post count
    await this.incrementUserPostCount(post.authorId);
    return newPost;
  }

  async updateForumPost(id: number, updates: Partial<{ title: string; content: string; isPinned: boolean; isLocked: boolean; categoryId: number }>): Promise<ForumPost | undefined> {
    const [post] = await db.update(forumPosts).set({ ...updates, updatedAt: new Date() }).where(eq(forumPosts.id, id)).returning();
    return post;
  }

  async deleteForumPost(id: number): Promise<void> {
    await db.delete(forumReplies).where(eq(forumReplies.postId, id));
    await db.delete(forumReactions).where(eq(forumReactions.postId, id));
    await db.delete(forumBookmarks).where(eq(forumBookmarks.postId, id));
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async incrementPostViewCount(id: number): Promise<void> {
    await db.update(forumPosts).set({ viewCount: sql`${forumPosts.viewCount} + 1` }).where(eq(forumPosts.id, id));
  }

  // Forum Replies
  async getForumReplies(postId: number): Promise<ForumReply[]> {
    return await db.select().from(forumReplies).where(eq(forumReplies.postId, postId)).orderBy(asc(forumReplies.createdAt));
  }

  async getForumReply(id: number): Promise<ForumReply | undefined> {
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, id));
    return reply;
  }

  async createForumReply(reply: InsertForumReply & { authorId: number }): Promise<ForumReply> {
    const [newReply] = await db.insert(forumReplies).values(reply).returning();
    // Update post reply count and last activity
    await db.update(forumPosts).set({ 
      replyCount: sql`${forumPosts.replyCount} + 1`,
      lastActivityAt: new Date()
    }).where(eq(forumPosts.id, reply.postId));
    // Update user's reply count
    await this.incrementUserReplyCount(reply.authorId);
    return newReply;
  }

  async updateForumReply(id: number, updates: Partial<{ content: string; isAcceptedAnswer: boolean }>): Promise<ForumReply | undefined> {
    const [reply] = await db.update(forumReplies).set({ ...updates, updatedAt: new Date() }).where(eq(forumReplies.id, id)).returning();
    return reply;
  }

  async deleteForumReply(id: number): Promise<void> {
    const reply = await this.getForumReply(id);
    if (reply) {
      await db.delete(forumReactions).where(eq(forumReactions.replyId, id));
      await db.delete(forumReplies).where(eq(forumReplies.id, id));
      // Update post reply count
      await db.update(forumPosts).set({ 
        replyCount: sql`GREATEST(${forumPosts.replyCount} - 1, 0)`
      }).where(eq(forumPosts.id, reply.postId));
    }
  }

  async getForumRepliesByUser(userId: number): Promise<ForumReply[]> {
    return await db.select().from(forumReplies)
      .where(eq(forumReplies.authorId, userId))
      .orderBy(desc(forumReplies.createdAt));
  }

  // Forum Reactions
  async getForumReactions(postId?: number, replyId?: number): Promise<ForumReaction[]> {
    if (postId) {
      return await db.select().from(forumReactions).where(eq(forumReactions.postId, postId));
    }
    if (replyId) {
      return await db.select().from(forumReactions).where(eq(forumReactions.replyId, replyId));
    }
    return [];
  }

  async toggleForumReaction(userId: number, postId: number | null, replyId: number | null, type: string): Promise<boolean> {
    const conditions = [eq(forumReactions.userId, userId), eq(forumReactions.type, type)];
    if (postId) conditions.push(eq(forumReactions.postId, postId));
    if (replyId) conditions.push(eq(forumReactions.replyId, replyId));
    
    const [existing] = await db.select().from(forumReactions).where(and(...conditions));
    
    if (existing) {
      await db.delete(forumReactions).where(eq(forumReactions.id, existing.id));
      return false;
    } else {
      await db.insert(forumReactions).values({ userId, postId, replyId, type });
      return true;
    }
  }

  // Forum Bookmarks
  async getForumBookmarks(userId: number): Promise<ForumBookmark[]> {
    return await db.select().from(forumBookmarks).where(eq(forumBookmarks.userId, userId));
  }

  async toggleForumBookmark(userId: number, postId: number): Promise<boolean> {
    const [existing] = await db.select().from(forumBookmarks).where(
      and(eq(forumBookmarks.userId, userId), eq(forumBookmarks.postId, postId))
    );
    
    if (existing) {
      await db.delete(forumBookmarks).where(eq(forumBookmarks.id, existing.id));
      return false;
    } else {
      await db.insert(forumBookmarks).values({ userId, postId });
      return true;
    }
  }

  // User Trust Levels
  async getUserTrustLevel(userId: number): Promise<UserTrustLevel | undefined> {
    const [level] = await db.select().from(userTrustLevels).where(eq(userTrustLevels.userId, userId));
    return level;
  }

  async getAllUserTrustLevels(): Promise<UserTrustLevel[]> {
    return await db.select().from(userTrustLevels);
  }

  async updateUserTrustLevel(userId: number, updates: Partial<UserTrustLevel>): Promise<UserTrustLevel> {
    const existing = await this.getUserTrustLevel(userId);
    if (existing) {
      const [updated] = await db.update(userTrustLevels).set({ ...updates, updatedAt: new Date() }).where(eq(userTrustLevels.userId, userId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(userTrustLevels).values({ userId, ...updates }).returning();
      return created;
    }
  }

  private async incrementUserPostCount(userId: number): Promise<void> {
    const existing = await this.getUserTrustLevel(userId);
    if (existing) {
      await db.update(userTrustLevels).set({ 
        postCount: sql`${userTrustLevels.postCount} + 1`,
        updatedAt: new Date()
      }).where(eq(userTrustLevels.userId, userId));
    } else {
      await db.insert(userTrustLevels).values({ userId, postCount: 1 });
    }
  }

  private async incrementUserReplyCount(userId: number): Promise<void> {
    const existing = await this.getUserTrustLevel(userId);
    if (existing) {
      await db.update(userTrustLevels).set({ 
        replyCount: sql`${userTrustLevels.replyCount} + 1`,
        updatedAt: new Date()
      }).where(eq(userTrustLevels.userId, userId));
    } else {
      await db.insert(userTrustLevels).values({ userId, replyCount: 1 });
    }
  }

  async getAnalytics(days: number = 30): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    openCases: number;
    closedCases: number;
    totalEvidence: number;
    aiChats: number;
    forumPosts: number;
    forumReplies: number;
    recentUsers: { date: string; count: number }[];
    recentCases: { date: string; count: number }[];
    periodNewUsers: number;
    periodNewCases: number;
    periodDays: number;
  }> {
    const now = new Date();
    const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Total users
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(users);
    
    // Active users (logged in within 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [{ value: activeUsers }] = await db.select({ value: count() }).from(users)
      .where(sql`${users.lastActiveAt} > ${sevenDaysAgo}`);
    
    // Total cases
    const [{ value: totalCases }] = await db.select({ value: count() }).from(incidents);
    
    // Open cases
    const [{ value: openCases }] = await db.select({ value: count() }).from(incidents)
      .where(eq(incidents.status, 'open'));
    
    // Closed cases
    const [{ value: closedCases }] = await db.select({ value: count() }).from(incidents)
      .where(eq(incidents.status, 'closed'));
    
    // Total evidence (photos, docs, calls, texts, emails)
    const [{ value: totalEvidence }] = await db.select({ value: count() }).from(incidentLogs)
      .where(sql`${incidentLogs.type} IN ('photo', 'document', 'call', 'text', 'email')`);
    
    // AI chats
    const [{ value: aiChats }] = await db.select({ value: count() }).from(incidentLogs)
      .where(eq(incidentLogs.type, 'chat'));
    
    // Forum posts
    const [{ value: forumPostsCount }] = await db.select({ value: count() }).from(forumPosts);
    
    // Forum replies
    const [{ value: forumRepliesCount }] = await db.select({ value: count() }).from(forumReplies);
    
    // Recent users (grouped by day)
    const recentUsersResult = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at > ${periodAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    // Recent cases (grouped by day)
    const recentCasesResult = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM incidents
      WHERE created_at > ${periodAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    // Period totals
    const periodNewUsers = (recentUsersResult.rows as any[]).reduce((sum, r) => sum + Number(r.count), 0);
    const periodNewCases = (recentCasesResult.rows as any[]).reduce((sum, r) => sum + Number(r.count), 0);

    return {
      totalUsers,
      activeUsers,
      totalCases,
      openCases,
      closedCases,
      totalEvidence,
      aiChats,
      forumPosts: forumPostsCount,
      forumReplies: forumRepliesCount,
      recentUsers: (recentUsersResult.rows as any[]).map(r => ({ 
        date: r.date?.toISOString?.() || String(r.date), 
        count: Number(r.count) 
      })),
      recentCases: (recentCasesResult.rows as any[]).map(r => ({ 
        date: r.date?.toISOString?.() || String(r.date), 
        count: Number(r.count) 
      })),
      periodNewUsers,
      periodNewCases,
      periodDays: days,
    };
  }

  async createPdfExport(incidentId: number, userId: number): Promise<PdfExport> {
    const [result] = await db.insert(pdfExports).values({ incidentId, userId }).returning();
    return result;
  }

  async getPdfExportsByIncident(incidentId: number): Promise<PdfExport[]> {
    return await db.select().from(pdfExports).where(eq(pdfExports.incidentId, incidentId)).orderBy(desc(pdfExports.createdAt));
  }

  async getPdfExportCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(pdfExports);
    return result?.count ?? 0;
  }

  async getRecentPdfExports(limit: number = 20): Promise<(PdfExport & { incident?: Incident; user?: User })[]> {
    const exports = await db.select().from(pdfExports).orderBy(desc(pdfExports.createdAt)).limit(limit);
    const results: (PdfExport & { incident?: Incident; user?: User })[] = [];
    
    for (const exp of exports) {
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, exp.incidentId));
      const [user] = await db.select().from(users).where(eq(users.id, exp.userId));
      results.push({ ...exp, incident, user });
    }
    
    return results;
  }

  async createLitigationReview(review: Omit<LitigationReview, 'id' | 'createdAt'>): Promise<LitigationReview> {
    const [result] = await db.insert(litigationReviews).values(review).returning();
    return result;
  }

  async getLitigationReview(id: number): Promise<LitigationReview | undefined> {
    const [result] = await db.select().from(litigationReviews).where(eq(litigationReviews.id, id));
    return result;
  }

  async getLitigationReviewsByIncident(incidentId: number): Promise<LitigationReview[]> {
    return await db.select().from(litigationReviews).where(eq(litigationReviews.incidentId, incidentId)).orderBy(desc(litigationReviews.createdAt));
  }

  async getLitigationReviewCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(litigationReviews);
    return result?.count ?? 0;
  }

  async getStrongCaseCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(litigationReviews).where(eq(litigationReviews.recommendation, 'strong'));
    return result?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
