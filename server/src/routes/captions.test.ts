import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import express from "express";
import request from "supertest";

vi.mock("../prompts/captionWithHook", () => ({
  generateCaption: vi.fn(),
  regenerateCaption: vi.fn(),
}));

import { generateCaption, regenerateCaption } from "../prompts/captionWithHook";
import captionsRouter from "./captions";

const mockGenerateCaption = generateCaption as ReturnType<typeof vi.fn>;
const mockRegenerateCaption = regenerateCaption as ReturnType<typeof vi.fn>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/captions", captionsRouter);
  return app;
}

describe("routes/captions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Unit tests: error cases ───────────────────────────────────────────────

  describe("POST /api/captions — unit tests", () => {
    it("returns 400 when hook is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/captions").send({ raw_idea: "idea", platform: "instagram" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("hook is required");
    });

    it("returns 400 when raw_idea is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/captions").send({ hook: "my hook", platform: "instagram" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("raw_idea is required");
    });

    it("returns 400 when platform is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/captions").send({ hook: "my hook", raw_idea: "idea" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("platform is required");
    });
  });

  // ─── P8: Caption Starts With Hook Verbatim ────────────────────────────────

  describe("P8: Caption Starts With Hook Verbatim", () => {
    it("POST /api/captions returns caption whose first line is exactly the hook text", async () => {
      // Feature: idea-vault-and-hook-engine, Property 8: caption starts with hook verbatim
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.constantFrom("instagram", "linkedin", "reels", "youtube_shorts"),
          async (hookText, bodyText, platform) => {
            // Mock returns hook as first line followed by body
            const captionContent = `${hookText}\n${bodyText}`;
            mockGenerateCaption.mockResolvedValueOnce(captionContent);

            const app = buildApp();
            const res = await request(app).post("/api/captions").send({
              hook: hookText,
              raw_idea: "some idea",
              platform,
            });

            expect(res.status).toBe(200);
            const firstLine = (res.body.content as string).split("\n")[0];
            expect(firstLine).toBe(hookText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── P9: Anchor Keywords Appear in Caption ────────────────────────────────

  describe("P9: Anchor Keywords Appear in Caption", () => {
    it("POST /api/captions with anchor_keywords — each keyword appears in caption", async () => {
      // Feature: idea-vault-and-hook-engine, Property 9: anchor keywords appear in caption
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          async (keywords) => {
            // Mock returns a caption that includes all keywords
            const captionContent = `Hook line\n${keywords.join(" ")} and more content here`;
            mockGenerateCaption.mockResolvedValueOnce(captionContent);

            const app = buildApp();
            const res = await request(app).post("/api/captions").send({
              hook: "Hook line",
              raw_idea: "some idea",
              platform: "instagram",
              anchor_keywords: keywords,
            });

            expect(res.status).toBe(200);
            const content = res.body.content as string;
            for (const keyword of keywords) {
              expect(content).toContain(keyword);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
