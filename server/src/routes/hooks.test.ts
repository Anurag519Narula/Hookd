import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import express from "express";
import request from "supertest";
import { ALLOWED_TRIGGERS } from "../prompts/hooks";

vi.mock("../prompts/hooks", async (importOriginal) => {
  const original = await importOriginal<typeof import("../prompts/hooks")>();
  return {
    ...original,
    generateHooks: vi.fn(),
  };
});

import { generateHooks } from "../prompts/hooks";
import hooksRouter from "./hooks";

const mockGenerateHooks = generateHooks as ReturnType<typeof vi.fn>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/hooks", hooksRouter);
  return app;
}

describe("routes/hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Unit tests: error cases ───────────────────────────────────────────────

  describe("POST /api/hooks — unit tests", () => {
    it("returns 400 when raw_idea is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/hooks").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("raw_idea is required");
    });

    it("returns 400 when raw_idea is empty string", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/hooks").send({ raw_idea: "" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("raw_idea is required");
    });
  });

  // ─── P7: Hook Array Invariants ────────────────────────────────────────────

  describe("P7: Hook Array Invariants", () => {
    it("POST /api/hooks returns exactly 5 hooks with distinct triggers from allowed set", async () => {
      // Feature: idea-vault-and-hook-engine, Property 7: hook array invariants
      const allowedTriggers = [...ALLOWED_TRIGGERS];

      // Arbitrary that generates exactly 5 hooks with distinct triggers from the allowed set
      const fiveHooksArb = fc
        .shuffledSubarray(allowedTriggers, { minLength: 5, maxLength: 5 })
        .map((triggers) =>
          triggers.map((trigger) => ({
            hook_text: `Hook for ${trigger}`,
            trigger,
          }))
        );

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fiveHooksArb,
          async (rawIdea, hooks) => {
            mockGenerateHooks.mockResolvedValueOnce(hooks);

            const app = buildApp();
            const res = await request(app).post("/api/hooks").send({ raw_idea: rawIdea });

            expect(res.status).toBe(200);
            const returned = res.body as Array<{ hook_text: string; trigger: string }>;

            // Exactly 5 hooks
            expect(returned).toHaveLength(5);

            // All triggers are distinct
            const triggers = returned.map((h) => h.trigger);
            const uniqueTriggers = new Set(triggers);
            expect(uniqueTriggers.size).toBe(5);

            // All triggers are from the allowed set
            for (const trigger of triggers) {
              expect(allowedTriggers).toContain(trigger);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
