import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        username: string;
        role: string;
        full_name: string | null;
        email: string | null;
      };
    }
  }
}

export {};
