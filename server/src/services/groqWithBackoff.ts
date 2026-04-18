import Groq from "groq-sdk";

interface GroqCompletionParams {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

// ── Exponential backoff for Groq rate limit (429) errors ─────────────────────
// Free tier: ~30 req/min, ~14,400 req/day
// On 429: wait 2^attempt * 1000ms + jitter, up to 4 retries
export async function groqWithBackoff(
  groq: Groq,
  params: GroqCompletionParams,
  maxRetries = 4
): Promise<Groq.Chat.ChatCompletion> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create(params);
      return completion;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry on rate limit (429) or server errors (5xx)
      const isRateLimit = lastError.message.includes("429") || lastError.message.toLowerCase().includes("rate limit");
      const isServerError = lastError.message.includes("500") || lastError.message.includes("502") || lastError.message.includes("503");

      if (!isRateLimit && !isServerError) {
        // Don't retry on client errors (400, 401, etc.)
        throw lastError;
      }

      if (attempt === maxRetries) break;

      // Exponential backoff: 1s, 2s, 4s, 8s + random jitter up to 500ms
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 500;
      const delay = baseDelay + jitter;

      console.warn(`[groq] Rate limited or server error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms…`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Groq request failed after retries");
}
