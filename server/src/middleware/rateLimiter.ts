import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// ── Shared error response ─────────────────────────────────────────────────────
function rateLimitHandler(_req: Request, res: Response) {
  res.status(429).json({
    error: "Too many requests. Please slow down and try again shortly.",
  });
}

// ── Auth endpoints: signup/login ──────────────────────────────────────────────
// Tight limit — prevents brute-force and account enumeration
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

// ── AI endpoints: Groq calls (amplify, studio, insights) ─────────────────────
// Secondary guard — primary per-user limits are enforced in usageLimits.ts (DB-backed)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 15,                   // 15 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ── General API: ideas, conversations, users ─────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 60,                   // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ── Trending (public, no auth) ────────────────────────────────────────────────
export const trendingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
