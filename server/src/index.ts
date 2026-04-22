import dotenv from "dotenv";
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY environment variable is not set.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "repurpose-ai-secret-key-change-in-prod") {
  if (process.env.NODE_ENV === "production") {
    console.error("Error: JWT_SECRET must be set to a strong secret in production.");
    process.exit(1);
  } else {
    console.warn("Warning: Using default JWT_SECRET. Set a strong secret before deploying.");
  }
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { initDb } from "./db";
import { requireAuth } from "./middleware/auth";
import { sanitizeInput, sanitizeQuery } from "./middleware/sanitize";
import { authLimiter, aiLimiter, generalLimiter, trendingLimiter } from "./middleware/rateLimiter";
import { purgeExpired } from "./services/dbCache";
import authRouter from "./routes/auth";
import generateRouter from "./routes/generate";
import regenerateRouter from "./routes/regenerate";
import transcriptRouter from "./routes/transcript";
import ideasRouter from "./routes/ideas";
import hooksRouter from "./routes/hooks";
import captionsRouter from "./routes/captions";
import insightsRouter from "./routes/insights";
import usersRouter from "./routes/users";
import conversationsRouter from "./routes/conversations";
import amplifyRouter from "./routes/amplify";
import studioRouter from "./routes/studio";
import trendingRouter from "./routes/trending";
import usageRouter from "./routes/usage";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow embedding if needed
  contentSecurityPolicy: false,     // handled by client
}));

// ── CORS — lock to known origins ──────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing with size limit ──────────────────────────────────────────────
app.use(express.json({ limit: "50kb" })); // prevent large payload attacks

// ── Global input sanitization ─────────────────────────────────────────────────
app.use(sanitizeInput);

const PORT = process.env.PORT ?? 3001;
const port = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;

initDb()
  .then(() => {
    // Purge expired cache rows on startup, then every 6 hours
    void purgeExpired().then((n) => n > 0 && console.log(`[cache] purged ${n} expired rows`));
    setInterval(() => {
      void purgeExpired().then((n) => n > 0 && console.log(`[cache] purged ${n} expired rows`));
    }, 6 * 60 * 60 * 1000);

    // ── Health check (for uptime monitoring / cron pings) ────────────────────
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", ts: Date.now() });
    });

    // ── Public routes ─────────────────────────────────────────────────────────
    app.use("/api/auth", authLimiter, authRouter);
    app.use("/api/trending", trendingLimiter, trendingRouter);

    // ── AI-heavy routes — rate limited per user ───────────────────────────────
    app.use("/api/amplify", aiLimiter, amplifyRouter);
    app.use("/api/studio", aiLimiter, studioRouter);
    app.use("/api/insights", aiLimiter, sanitizeQuery, requireAuth, insightsRouter);

    // ── General protected routes ──────────────────────────────────────────────
    app.use("/api/ideas", generalLimiter, requireAuth, ideasRouter);
    app.use("/api/users", generalLimiter, requireAuth, usersRouter);
    app.use("/api/conversations", generalLimiter, requireAuth, conversationsRouter);
    app.use("/api/usage", generalLimiter, requireAuth, usageRouter);

    // ── Legacy routes ─────────────────────────────────────────────────────────
    app.use("/api/generate", generalLimiter, requireAuth, generateRouter);
    app.use("/api/regenerate", generalLimiter, requireAuth, regenerateRouter);
    app.use("/api/transcript", generalLimiter, requireAuth, transcriptRouter);
    app.use("/api/hooks", generalLimiter, requireAuth, hooksRouter);
    app.use("/api/captions", generalLimiter, requireAuth, captionsRouter);

    // ── 404 handler ───────────────────────────────────────────────────────────
    app.use((_req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    // ── Global error handler ──────────────────────────────────────────────────
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("[error]", err.message);
      // Don't leak stack traces in production
      const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
      res.status(500).json({ error: message });
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port} [${process.env.NODE_ENV ?? "development"}]`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

export default app;
