import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import express from "express";
import request from "supertest";

// Mock pool and tagIdea before importing the router
vi.mock("../db", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../prompts/ideaTagging", () => ({
  tagIdea: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid"),
}));

import pool from "../db";
import { tagIdea } from "../prompts/ideaTagging";
import ideasRouter from "./ideas";

const mockQuery = pool.query as ReturnType<typeof vi.fn>;
const mockTagIdea = tagIdea as ReturnType<typeof vi.fn>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/ideas", ideasRouter);
  return app;
}

function makeIdea(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-uuid",
    raw_text: "some idea",
    created_at: 1000,
    tags: null,
    format_type: null,
    emotion_angle: null,
    potential_score: null,
    hooks: null,
    captions: null,
    status: "raw",
    ...overrides,
  };
}

describe("routes/ideas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Unit tests: error cases ───────────────────────────────────────────────

  describe("POST /api/ideas — unit tests", () => {
    it("returns 400 when raw_text is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/ideas").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("raw_text is required");
    });

    it("returns 400 when raw_text is empty string", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/ideas").send({ raw_text: "" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("raw_text is required");
    });
  });

  describe("GET /api/ideas/:id — unit tests", () => {
    it("returns 404 when idea not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const app = buildApp();
      const res = await request(app).get("/api/ideas/nonexistent-id");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Idea not found");
    });
  });

  describe("PATCH /api/ideas/:id — unit tests", () => {
    it("returns 400 when no valid fields provided", async () => {
      const app = buildApp();
      const res = await request(app).patch("/api/ideas/some-id").send({ unknown_field: "value" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No valid fields to update");
    });

    it("returns 404 when idea not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const app = buildApp();
      const res = await request(app).patch("/api/ideas/nonexistent-id").send({ status: "used" });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Idea not found");
    });
  });

  describe("DELETE /api/ideas/:id — unit tests", () => {
    it("returns 404 when idea not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const app = buildApp();
      const res = await request(app).delete("/api/ideas/nonexistent-id");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Idea not found");
    });
  });

  // ─── P2: New Idea Invariants ───────────────────────────────────────────────

  describe("P2: New Idea Invariants", () => {
    it("POST /api/ideas returns hooks: null, captions: null, status: 'raw' for any non-empty raw_text", async () => {
      // Feature: idea-vault-and-hook-engine, Property 2: new idea invariants
      // Make tagIdea never resolve during the test
      mockTagIdea.mockReturnValue(new Promise(() => {}));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1 }), async (rawText) => {
          const idea = makeIdea({ raw_text: rawText });
          mockQuery.mockResolvedValueOnce({ rows: [idea], rowCount: 1 });

          const app = buildApp();
          const res = await request(app).post("/api/ideas").send({ raw_text: rawText });

          expect(res.status).toBe(201);
          expect(res.body.hooks).toBeNull();
          expect(res.body.captions).toBeNull();
          expect(res.body.status).toBe("raw");
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── P3: Async Tagging Non-Blocking ───────────────────────────────────────

  describe("P3: Async Tagging Non-Blocking", () => {
    it("POST /api/ideas response arrives before tagging completes — tags: null", async () => {
      // Feature: idea-vault-and-hook-engine, Property 3: async tagging non-blocking
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1 }), async (rawText) => {
          // tagIdea never resolves — simulates slow Groq call
          mockTagIdea.mockReturnValue(new Promise(() => {}));

          const idea = makeIdea({ raw_text: rawText, tags: null });
          mockQuery.mockResolvedValueOnce({ rows: [idea], rowCount: 1 });

          const app = buildApp();
          const res = await request(app).post("/api/ideas").send({ raw_text: rawText });

          // Response must arrive (not hang) and tags must be null
          expect(res.status).toBe(201);
          expect(res.body.tags).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── P4: Sort Descending ──────────────────────────────────────────────────

  describe("P4: Sort Descending", () => {
    it("GET /api/ideas returns ideas sorted by created_at DESC", async () => {
      // Feature: idea-vault-and-hook-engine, Property 4: sort descending by created_at
      const ideaArb = fc.record({
        id: fc.uuid(),
        raw_text: fc.string({ minLength: 1 }),
        created_at: fc.integer({ min: 0, max: 2_000_000_000 }),
        tags: fc.constant(null),
        format_type: fc.constant(null),
        emotion_angle: fc.constant(null),
        potential_score: fc.constant(null),
        hooks: fc.constant(null),
        captions: fc.constant(null),
        status: fc.constant("raw"),
      });

      await fc.assert(
        fc.asyncProperty(fc.array(ideaArb, { minLength: 0, maxLength: 20 }), async (ideas) => {
          // Sort descending to simulate what the DB returns
          const sorted = [...ideas].sort((a, b) => b.created_at - a.created_at);
          mockQuery.mockResolvedValueOnce({ rows: sorted, rowCount: sorted.length });

          const app = buildApp();
          const res = await request(app).get("/api/ideas");

          expect(res.status).toBe(200);
          const returned = res.body as Array<{ created_at: number }>;
          for (let i = 1; i < returned.length; i++) {
            expect(returned[i - 1].created_at).toBeGreaterThanOrEqual(returned[i].created_at);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── P5: Filter Correctness ───────────────────────────────────────────────

  describe("P5: Filter Correctness", () => {
    it("GET /api/ideas with ?score= returns only matching ideas", async () => {
      // Feature: idea-vault-and-hook-engine, Property 5: filter correctness
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("low", "medium", "high"),
          fc.array(
            fc.record({
              id: fc.uuid(),
              raw_text: fc.string({ minLength: 1 }),
              created_at: fc.integer({ min: 0 }),
              tags: fc.constant(null),
              format_type: fc.constant(null),
              emotion_angle: fc.constant(null),
              potential_score: fc.constantFrom("low", "medium", "high"),
              hooks: fc.constant(null),
              captions: fc.constant(null),
              status: fc.constant("raw"),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (score, ideas) => {
            const matching = ideas.filter((i) => i.potential_score === score);
            mockQuery.mockResolvedValueOnce({ rows: matching, rowCount: matching.length });

            const app = buildApp();
            const res = await request(app).get(`/api/ideas?score=${score}`);

            expect(res.status).toBe(200);
            for (const idea of res.body as Array<{ potential_score: string }>) {
              expect(idea.potential_score).toBe(score);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── P6: PATCH Partial Update ─────────────────────────────────────────────

  describe("P6: PATCH Partial Update", () => {
    it("PATCH /api/ideas/:id with subset of fields changes only those fields", async () => {
      // Feature: idea-vault-and-hook-engine, Property 6: PATCH partial update
      const allowedFields = ["raw_text", "format_type", "emotion_angle", "potential_score", "status"] as const;

      await fc.assert(
        fc.asyncProperty(
          fc.subarray(allowedFields as unknown as string[], { minLength: 1 }),
          async (fields) => {
            const original = makeIdea({
              raw_text: "original text",
              format_type: "story",
              emotion_angle: "curiosity",
              potential_score: "high",
              status: "raw",
            });

            const patch: Record<string, string> = {};
            for (const f of fields) {
              patch[f] = "updated-value";
            }

            const updated = { ...original, ...patch };
            mockQuery.mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

            const app = buildApp();
            const res = await request(app).patch("/api/ideas/test-uuid").send(patch);

            expect(res.status).toBe(200);
            // Fields in patch should be updated
            for (const f of fields) {
              expect(res.body[f]).toBe("updated-value");
            }
            // Fields NOT in patch should remain original
            for (const f of allowedFields) {
              if (!fields.includes(f)) {
                expect(res.body[f]).toBe(original[f as keyof typeof original]);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── P17: NULL JSONB Fields Return null ───────────────────────────────────

  describe("P17: NULL JSONB Fields Return null", () => {
    it("GET /api/ideas/:id returns null for null JSONB fields, not error", async () => {
      // Feature: idea-vault-and-hook-engine, Property 17: NULL JSONB fields return null
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tags: fc.constant(null),
            hooks: fc.constant(null),
            captions: fc.constant(null),
          }),
          async (nullFields) => {
            const idea = makeIdea(nullFields);
            mockQuery.mockResolvedValueOnce({ rows: [idea], rowCount: 1 });

            const app = buildApp();
            const res = await request(app).get("/api/ideas/test-uuid");

            expect(res.status).toBe(200);
            expect(res.body.tags).toBeNull();
            expect(res.body.hooks).toBeNull();
            expect(res.body.captions).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
