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

import express from "express";
import cors from "cors";
import { initDb } from "./db";
import { requireAuth } from "./middleware/auth";
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

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT ?? 3001;
const port = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;

initDb()
  .then(() => {
    // Purge expired cache rows on startup, then every 6 hours
    void purgeExpired().then((n) => n > 0 && console.log(`[cache] purged ${n} expired rows`));
    setInterval(() => {
      void purgeExpired().then((n) => n > 0 && console.log(`[cache] purged ${n} expired rows`));
    }, 6 * 60 * 60 * 1000);

    // Public routes
    app.use("/api/auth", authRouter);

    // Protected routes — require valid JWT
    app.use("/api/generate", requireAuth, generateRouter);
    app.use("/api/regenerate", requireAuth, regenerateRouter);
    app.use("/api/transcript", requireAuth, transcriptRouter);
    app.use("/api/ideas", requireAuth, ideasRouter);
    app.use("/api/hooks", requireAuth, hooksRouter);
    app.use("/api/captions", requireAuth, captionsRouter);
    app.use("/api/insights", requireAuth, insightsRouter);
    app.use("/api/users", requireAuth, usersRouter);
    app.use("/api/conversations", requireAuth, conversationsRouter);
    app.use("/api/amplify", amplifyRouter);
    app.use("/api/studio", studioRouter);
    app.use("/api/trending", trendingRouter); // public — no auth

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

export default app;
