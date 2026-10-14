import { NextFunction, Request, Response } from "express";

/** Must run after authMiddleware. */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Administrators only." });
  next();
}
