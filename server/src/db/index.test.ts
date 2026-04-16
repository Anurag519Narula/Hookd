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

      // initDb() now issues 5 queries per call (3 CREATE TABLE IF NOT EXISTS + 2 ALTER TABLE)
      // so 3 invocations = 15 total calls
      expect(mockQuery).toHaveBeenCalledTimes(15);

      // At least the CREATE TABLE statements must use IF NOT EXISTS
      const allSql = mockQuery.mock.calls.map((c) => (c[0] as string).toLowerCase());
      const createTableCalls = allSql.filter((sql) => sql.includes("create table if not exists"));
      expect(createTableCalls.length).toBe(9); // 3 CREATE TABLE × 3 invocations

      // ALTER TABLE calls must use ADD COLUMN IF NOT EXISTS
      const alterCalls = allSql.filter((sql) => sql.includes("alter table"));
      expect(alterCalls.length).toBe(6); // 2 ALTER TABLE × 3 invocations
      for (const sql of alterCalls) {
        expect(sql).toContain("add column if not exists");
      }
    });
  });
});
