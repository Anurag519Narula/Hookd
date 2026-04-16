/**
 * Simple in-memory TTL cache for expensive API calls.
 * Keyed by a string, values expire after `ttlMs`.
 * No external dependencies — intentionally lightweight.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMs: number, maxSize = 500) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}

// ── Shared cache instances ─────────────────────────────────────────────────────

/** Hashtag intelligence: YouTube + Groq synthesis. TTL 6 hours. */
export const hashtagCache = new TTLCache<unknown>(6 * 60 * 60 * 1000, 200);

/** Studio hook generation. TTL 1 hour (hooks are creative, shorter TTL). */
export const studioHooksCache = new TTLCache<unknown>(60 * 60 * 1000, 100);

/** Studio script (beats+CTA) generation. TTL 1 hour. */
export const studioScriptCache = new TTLCache<unknown>(60 * 60 * 1000, 100);

/** YouTube raw results. TTL 3 hours. */
export const youtubeCache = new TTLCache<unknown>(3 * 60 * 60 * 1000, 300);

/**
 * Build a normalised cache key from arbitrary params.
 * Sorts object keys so {a:1,b:2} and {b:2,a:1} produce the same key.
 */
export function cacheKey(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}
