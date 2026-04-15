// Feature: idea-vault-and-hook-engine, Property 13: Settings Included in Hook and Caption Requests

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useDevelop } from "./useDevelop";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeFetchMock(responseBody: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseBody),
  });
}

describe("useDevelop — P13: Settings values included in hook and caption requests", () => {
  it("generateHooks includes niche, sub_niche, and language in the request body", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          niche: fc.string({ minLength: 1 }),
          sub_niche: fc.string({ minLength: 1 }),
          language: fc.string({ minLength: 1 }),
        }),
        async ({ niche, sub_niche, language }) => {
          const mockFetch = makeFetchMock([
            { hook_text: "Hook 1", trigger: "Curiosity Gap" },
            { hook_text: "Hook 2", trigger: "Identity Threat" },
            { hook_text: "Hook 3", trigger: "Controversy" },
            { hook_text: "Hook 4", trigger: "Surprising Stat" },
            { hook_text: "Hook 5", trigger: "Personal Story Angle" },
          ]);
          vi.stubGlobal("fetch", mockFetch);

          const { result, unmount } = renderHook(() => useDevelop());

          await act(async () => {
            await result.current.generateHooks({
              raw_idea: "test idea",
              niche,
              sub_niche,
              language,
            });
          });

          expect(mockFetch).toHaveBeenCalledOnce();
          const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
          const body = JSON.parse(options.body as string);

          expect(body.niche).toBe(niche);
          expect(body.sub_niche).toBe(sub_niche);
          expect(body.language).toBe(language);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("generateCaption includes niche and language in the request body", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          niche: fc.string({ minLength: 1 }),
          language: fc.string({ minLength: 1 }),
        }),
        async ({ niche, language }) => {
          const mockFetch = makeFetchMock({ content: "Generated caption text" });
          vi.stubGlobal("fetch", mockFetch);

          const { result, unmount } = renderHook(() => useDevelop());

          await act(async () => {
            await result.current.generateCaption({
              hook: "My hook",
              raw_idea: "test idea",
              platform: "instagram",
              niche,
              anchor_keywords: [],
              language,
            });
          });

          expect(mockFetch).toHaveBeenCalledOnce();
          const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
          const body = JSON.parse(options.body as string);

          expect(body.niche).toBe(niche);
          expect(body.language).toBe(language);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
