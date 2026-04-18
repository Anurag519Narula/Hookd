import { Request, Response, NextFunction } from "express";

// ── Prompt injection patterns ─────────────────────────────────────────────────
// These are common jailbreak/injection attempts targeting LLMs
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /you\s+are\s+now\s+(a\s+)?(different|new|another|evil|uncensored)/i,
  /forget\s+(everything|all|your|the)\s+(instructions?|rules?|guidelines?|training)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(an?\s+)?(unrestricted|uncensored|jailbroken|evil|dan)/i,
  /\[system\]/i,
  /\[assistant\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /###\s*(instruction|system|human|assistant)/i,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /prompt\s+injection/i,
];

// ── Max lengths per field ─────────────────────────────────────────────────────
const MAX_LENGTHS: Record<string, number> = {
  prompt: 2000,
  idea: 2000,
  feedback: 500,
  name: 80,
  email: 254,
  password: 128,
  niche: 100,
  sub_niche: 100,
  language: 50,
  title: 200,
};

function containsInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

function truncate(value: string, field: string): string {
  const max = MAX_LENGTHS[field] ?? 5000;
  return value.slice(0, max);
}

// ── Recursively sanitize string fields in an object ───────────────────────────
function sanitizeObject(obj: Record<string, unknown>, depth = 0): { clean: Record<string, unknown>; injectionDetected: boolean } {
  if (depth > 5) return { clean: obj, injectionDetected: false }; // prevent deep recursion
  let injectionDetected = false;
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      const truncated = truncate(value, key);
      if (containsInjection(truncated)) {
        injectionDetected = true;
      }
      clean[key] = truncated;
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) => {
        if (typeof item === "string") {
          if (containsInjection(item)) injectionDetected = true;
          return item.slice(0, 500);
        }
        if (typeof item === "object" && item !== null) {
          const result = sanitizeObject(item as Record<string, unknown>, depth + 1);
          if (result.injectionDetected) injectionDetected = true;
          return result.clean;
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      const result = sanitizeObject(value as Record<string, unknown>, depth + 1);
      if (result.injectionDetected) injectionDetected = true;
      clean[key] = result.clean;
    } else {
      clean[key] = value;
    }
  }

  return { clean, injectionDetected };
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object") return next();

  const { clean, injectionDetected } = sanitizeObject(req.body as Record<string, unknown>);

  if (injectionDetected) {
    console.warn(`[security] Prompt injection attempt detected from IP ${req.ip} on ${req.method} ${req.path}`);
    return res.status(400).json({ error: "Invalid input detected." });
  }

  req.body = clean;
  next();
}

// ── Query param sanitizer (for GET requests with idea/niche params) ───────────
export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      const max = MAX_LENGTHS[key] ?? 2000;
      const truncated = value.slice(0, max);
      if (containsInjection(truncated)) {
        console.warn(`[security] Injection in query param '${key}' from IP ${req.ip}`);
        return res.status(400).json({ error: "Invalid input detected." });
      }
      req.query[key] = truncated;
    }
  }
  next();
}
