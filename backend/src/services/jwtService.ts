import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET || 'access-secret-key-change-in-production';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production';

  /**
   * Generate access and refresh token pair
   */
  static generateTokenPair(user: {
    id: number;
    username: string;
    email: string;
    role: string;
  }): TokenPair {
    try {
      const payload: JWTPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, this.ACCESS_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
      });

      const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
      });

      // Get expiry time in seconds (15 * 60)
      const expiresIn = 15 * 60;

      logger.info(`JWT tokens generated for user: ${user.username}`);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error generating JWT tokens:', error);
      throw new Error('Failed to generate tokens');
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_SECRET, {
        algorithms: ['HS256'],
      }) as JWTPayload;
      return decoded;
    } catch (error: any) {
      logger.warn(`Invalid access token: ${error.message}`);
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as JWTPayload;
      return decoded;
    } catch (error: any) {
      logger.warn(`Invalid refresh token: ${error.message}`);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Generate new access token from refresh token
   */
  static refreshAccessToken(refreshToken: string): string {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      const newPayload: JWTPayload = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      };

      const accessToken = jwt.sign(newPayload, this.ACCESS_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
      });

      logger.info(`Access token refreshed for user: ${payload.username}`);

      return accessToken;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}
