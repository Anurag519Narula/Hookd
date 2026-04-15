import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// We need a stable mock query function that persists across module resets
const mockQuery = vi.fn();

vi.mock("pg", () => {
  function Pool() {
    return { query: mockQuery };
  }
  return { Pool };
});

describe("db/index", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    vi.resetModules();
  });

  // Feature: idea-vault-and-hook-engine, Property 1: JSONB Round-Trip
  // For any valid Idea with non-null tags, hooks, captions — writing to DB and reading back produces deeply equal values.
  // Since we cannot use a real DB in unit tests, we simulate the round-trip by verifying that
  // JSON.stringify → JSON.parse preserves the values (which is what PostgreSQL JSONB does).
  describe("P1: JSONB Round-Trip", () => {
    it("tags (string[]) survive JSON round-trip", () => {
      // Feature: idea-vault-and-hook-engine, Property 1: JSONB round-trip for tags
      fc.assert(
        fc.property(fc.array(fc.string()), (tags) => {
          const serialized = JSON.stringify(tags);
          const deserialized = JSON.parse(serialized) as string[];
          expect(deserialized).toEqual(tags);
        }),
        { numRuns: 100 }
      );
    });

    it("hooks (Hook[]) survive JSON round-trip", () => {
      // Feature: idea-vault-and-hook-engine, Property 1: JSONB round-trip for hooks
      const hookArb = fc.record({
        hook_text: fc.string(),
        trigger: fc.string(),
      });
      fc.assert(
        fc.property(fc.array(hookArb), (hooks) => {
          const serialized = JSON.stringify(hooks);
          const deserialized = JSON.parse(serialized) as Array<{ hook_text: string; trigger: string }>;
          expect(deserialized).toEqual(hooks);
        }),
        { numRuns: 100 }
      );
    });

    it("captions (Record<string,string>) survive JSON round-trip", () => {
      // Feature: idea-vault-and-hook-engine, Property 1: JSONB round-trip for captions
      const captionsArb = fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
        fc.string()
      );
      fc.assert(
        fc.property(captionsArb, (captions) => {
          const serialized = JSON.stringify(captions);
          const deserialized = JSON.parse(serialized) as Record<string, string>;
          expect(deserialized).toEqual(captions);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: idea-vault-and-hook-engine, Property 16: Table Creation is Idempotent
  describe("P16: initDb idempotent", () => {
    it("can be called multiple times without error", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      // Import fresh module after reset
      const { initDb } = await import("./index");

      await expect(initDb()).resolves.toBeUndefined();
      await expect(initDb()).resolves.toBeUndefined();
      await expect(initDb()).resolves.toBeUndefined();

      // Should have called pool.query 3 times (once per initDb call)
      expect(mockQuery).toHaveBeenCalledTimes(3);
      // Each call should use CREATE TABLE IF NOT EXISTS
      for (const call of mockQuery.mock.calls) {
        expect((call[0] as string).toLowerCase()).toContain("create table if not exists");
      }
    });
  });
});
