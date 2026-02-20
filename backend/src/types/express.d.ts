import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: number;
    };
  }
}

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email?: string;
      full_name?: string;
      ldap_dn?: string;
      is_active: boolean;
      last_login_at?: Date;
      created_at: Date;
      updated_at: Date;
    }

    interface Request {
      isAuthenticated(): boolean;
      isUnauthenticated(): boolean;
      user?: User;
      login(user: any, done: (err: any) => void): void;
      logout(done: (err: any) => void): void;
    }
  }
}

export {};
