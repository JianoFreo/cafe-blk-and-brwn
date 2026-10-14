import { NextFunction, Request, Response } from "express";

/** Tiny in-memory limiter: `max` requests per `windowMs` per IP. Good enough for one small server. */
export function rateLimit(max: number, windowMs: number, message = "Too many attempts. Please try again later.") {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) return res.status(429).json({ error: message });
    next();
  };
}
