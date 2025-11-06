import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './database';
import { DatabaseService } from './database';

const PgSession = connectPgSimple(session);

// Session configuration
export const sessionConfig = {
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: false, // We handle table creation in migrations
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'netadmin.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: 'lax' as const,
  },
  rolling: true, // Reset expiration on each request
};

// Session cleanup service
export class SessionService {
  private static instance: SessionService;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Start automatic cleanup of expired sessions
   * Runs every hour
   */
  public startCleanup(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    // Run immediately
    this.cleanExpiredSessions();

    // Then run every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Session cleanup service started');
  }

  /**
   * Stop automatic cleanup
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session cleanup service stopped');
    }
  }

  /**
   * Clean expired sessions from database
   */
  private async cleanExpiredSessions(): Promise<void> {
    try {
      const result = await DatabaseService.query(
        'DELETE FROM sessions WHERE expire < CURRENT_TIMESTAMP'
      );
      console.log(`Cleaned ${result.rowCount} expired sessions`);
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  /**
   * Update last activity timestamp for a session
   */
  public async updateActivity(sessionId: string, userId: number): Promise<void> {
    try {
      await DatabaseService.query(
        `UPDATE sessions 
         SET last_activity_at = CURRENT_TIMESTAMP 
         WHERE sid = $1 AND user_id = $2`,
        [sessionId, userId]
      );
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Check if a session is still valid (within 15 minutes of last activity)
   */
  public async isSessionValid(sessionId: string, userId: number): Promise<boolean> {
    try {
      const result = await DatabaseService.query(
        `SELECT sid FROM sessions 
         WHERE sid = $1 
         AND user_id = $2 
         AND expire > CURRENT_TIMESTAMP 
         AND last_activity_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'`,
        [sessionId, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: number): Promise<any[]> {
    try {
      const result = await DatabaseService.query(
        `SELECT sid, expire, last_activity_at, ip_address, user_agent, created_at
         FROM sessions
         WHERE user_id = $1 AND expire > CURRENT_TIMESTAMP
         ORDER BY last_activity_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Destroy a specific session
   */
  public async destroySession(sessionId: string): Promise<boolean> {
    try {
      const result = await DatabaseService.query(
        'DELETE FROM sessions WHERE sid = $1',
        [sessionId]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error destroying session:', error);
      return false;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  public async destroyUserSessions(userId: number): Promise<void> {
    try {
      await DatabaseService.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    } catch (error) {
      console.error('Error destroying user sessions:', error);
    }
  }
}

export default sessionConfig;
