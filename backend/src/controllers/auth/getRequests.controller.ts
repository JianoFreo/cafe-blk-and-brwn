import { Request, Response } from "express";

// GET /api/auth/me  (requires a valid token)
export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
