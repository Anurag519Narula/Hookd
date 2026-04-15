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
import authRouter from "./routes/auth";
import generateRouter from "./routes/generate";
import regenerateRouter from "./routes/regenerate";
import transcriptRouter from "./routes/transcript";
import ideasRouter from "./routes/ideas";
import hooksRouter from "./routes/hooks";
import captionsRouter from "./routes/captions";
import insightsRouter from "./routes/insights";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT ?? 3001;
const port = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;

initDb()
  .then(() => {
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

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

export default app;
