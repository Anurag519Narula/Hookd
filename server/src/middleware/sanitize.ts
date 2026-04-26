import { Request, Response, NextFunction } from "express";

// ── Topic guardrail patterns ──────────────────────────────────────────────────
// Block harmful or deceptive content categories before they reach AI processing
const TOPIC_GUARDRAIL_PATTERNS: Array<{ category: string; patterns: RegExp[] }> = [
  {
    category: "illegal business and scams",
    patterns: [
      /\b(ponzi|pyramid)\s*scheme/i,
      /\bmoney\s*launder/i,
      /\bcounterfeit(ing)?\b/i,
      /\bfraud(ulent)?\s*(business|scheme|operation)/i,
      /\b(drug|arms|weapon)\s*traffick/i,
      /\billegal\s*(business|scheme|operation|trade|market)/i,
      /\bscam(ming)?\s*(people|victims|elderly|seniors)/i,
      /\bphishing\s*(attack|scheme|campaign)/i,
      /\bidentity\s*theft\b/i,
    ],
  },
  {
    category: "harmful health advice",
    patterns: [
      /\b(cure|treat|heal)\s*(cancer|diabetes|hiv|aids)\s*(with|using|by)\s*(bleach|ivermectin|turpentine|urine)/i,
      /\banti[\s-]?vax(x)?(ination)?\s*(movement|propaganda|content)/i,
      /\banti[\s-]?vaccination\s*(movement|propaganda|content)/i,
      /\bfake\s*(cure|medicine|treatment|remedy)/i,
      /\bdangerous\s*(diet|detox|cleanse|supplement)\b/i,
      /\bself[\s-]?medic(ate|ation)\s*(with|using)\b/i,
    ],
  },
  {
    category: "sexual exploitation",
    patterns: [
      /\bchild\s*(porn|exploitation|abuse|sexual)/i,
      /\bsexual\s*(exploit|traffick|groom)/i,
      /\brevenge\s*porn/i,
      /\bnon[\s-]?consensual\s*(porn|intimate|image)/i,
      /\bsextort/i,
    ],
  },
  {
    category: "hate speech and extremism",
    patterns: [
      /\b(white|racial)\s*suprem/i,
      /\bneo[\s-]?nazi/i,
      /\bethnic\s*cleans/i,
      /\bgenocide\s*(promot|advocat|support)/i,
      /\b(recruit|radicali[sz])(e|ing)?\s*(for|into)\s*(terror|extremis)/i,
      /\bhate\s*(group|movement|propaganda)\b/i,
    ],
  },
  {
    category: "plagiarism spam",
    patterns: [
      /\b(mass|bulk)\s*(plagiari[sz]|copy|steal|scrape)\b/i,
      /\bspam\s*(farm|bot|network|campaign)\b/i,
      /\b(steal|rip|scrape)\s*(content|article|video|post)s?\s*(from|off)\b/i,
      /\bcontent\s*(farm|mill|spinning)\b/i,
      /\bauto[\s-]?generat(e|ed|ing)\s*(fake|spam|mass)\b/i,
    ],
  },
];

export function containsBlockedTopic(text: string): boolean {
  return TOPIC_GUARDRAIL_PATTERNS.some((category) =>
    category.patterns.some((pattern) => {
      try {
        return pattern.test(text);
      } catch {
        console.warn(`[security] Regex error in topic guardrail category: ${category.category}`);
        return false;
      }
    })
  );
}

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

// ── Extract all string values from an object for topic checking ───────────────
function extractTextFields(obj: Record<string, unknown>): string {
  const texts: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      texts.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") texts.push(item);
      }
    }
  }
  return texts.join(" ");
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object") return next();

  const { clean, injectionDetected } = sanitizeObject(req.body as Record<string, unknown>);

  if (injectionDetected) {
    console.warn(`[security] Prompt injection attempt detected from IP ${req.ip} on ${req.method} ${req.path}`);
    return res.status(400).json({ error: "Invalid input detected." });
  }

  // Check for blocked topics in string fields
  const bodyText = extractTextFields(clean);
  if (containsBlockedTopic(bodyText)) {
    console.warn(`[security] Blocked topic detected from IP ${req.ip} on ${req.method} ${req.path}`);
    return res.status(400).json({ error: "We can't help optimize harmful or deceptive ideas. Try a different angle." });
  }

  req.body = clean;
  next();
}

// ── Query param sanitizer (for GET requests with idea/niche params) ───────────
export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  const queryTexts: string[] = [];
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      const max = MAX_LENGTHS[key] ?? 2000;
      const truncated = value.slice(0, max);
      if (containsInjection(truncated)) {
        console.warn(`[security] Injection in query param '${key}' from IP ${req.ip}`);
        return res.status(400).json({ error: "Invalid input detected." });
      }
      req.query[key] = truncated;
      queryTexts.push(truncated);
    }
  }

  // Check for blocked topics across all query params
  if (containsBlockedTopic(queryTexts.join(" "))) {
    console.warn(`[security] Blocked topic in query params from IP ${req.ip}`);
    return res.status(400).json({ error: "We can't help optimize harmful or deceptive ideas. Try a different angle." });
  }

  next();
}
