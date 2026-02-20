/**
 * Token Manager - Handles JWT token storage and lifecycle
 * Stores: accessToken, refreshToken
 * Strategy: localStorage (survives page reload)
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
}

const TOKEN_STORAGE_KEY = 'jwt_tokens';

export class TokenManager {
  /**
   * Store tokens in localStorage
   */
  static storeTokens(tokens: TokenPair): void {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    const stored: StoredTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
  }

  /**
   * Retrieve stored tokens
   */
  static getTokens(): StoredTokens | null {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    const tokens = this.getTokens();
    if (!tokens) return null;
    
    // Check if token is expired
    if (this.isAccessTokenExpired(tokens)) {
      return null; // Token expired, need to refresh
    }
    
    return tokens.accessToken;
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Check if access token is expired (with 1 minute buffer)
   */
  static isAccessTokenExpired(tokens: StoredTokens = this.getTokens()!): boolean {
    if (!tokens) return true;
    
    // Check 1 minute before actual expiry to avoid edge cases
    const bufferTime = 60 * 1000; // 1 minute
    return Date.now() >= (tokens.expiresAt - bufferTime);
  }

  /**
   * Update access token (after refresh)
   */
  static updateAccessToken(newAccessToken: string, expiresIn: number): void {
    const tokens = this.getTokens();
    if (tokens) {
      const expiresAt = Date.now() + expiresIn * 1000;
      const updated: StoredTokens = {
        ...tokens,
        accessToken: newAccessToken,
        expiresAt,
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Check if user has valid tokens stored
   */
  static hasValidTokens(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    
    // Check if access token is not expired
    return !this.isAccessTokenExpired(tokens);
  }

  /**
   * Check if refresh token is available
   */
  static hasRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken;
  }

  /**
   * Decode JWT payload (unsafe - for inspection only)
   * Note: This does NOT verify the token signature
   */
  static decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = atob(parts[1]);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user info from stored access token
   */
  static getUserInfo(): { userId: number; username: string; email: string; role: string } | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;
    
    const decoded = this.decodeToken(accessToken);
    if (!decoded) return null;
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
  }
}

export default TokenManager;
