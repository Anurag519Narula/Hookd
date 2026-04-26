# Hookd — Complete Project Knowledge Base

> This document is a comprehensive reference for the Hookd project. It covers the product vision, architecture, every feature, data models, AI prompt design, API surface, caching strategy, security model, and future roadmap. Feed this to any LLM to give it full context on the project.

---

## 1. What Hookd Is

Hookd is an AI-powered "Creator OS" — a full-stack web application that takes a content creator from a raw idea all the way to platform-ready captions and scripts. It is built for short-form video creators (Instagram Reels, YouTube Shorts, LinkedIn, Instagram feed) with a particular focus on the Indian creator ecosystem.

The product name is "Hookd" (stylized). The internal package name is `repurpose-ai`.

### Core Philosophy

- Every piece of content starts as a raw idea. Most creators lose ideas or never validate them before filming.
- Hookd captures ideas instantly, validates them against real market data, generates psychologically-grounded hooks, builds timestamped scripts, and produces platform-native captions with live hashtag intelligence.
- The AI never writes generic content. Every prompt is personalized with the creator's niche, sub-niche, language preference, and platform priority.
- The product enforces a specific creative workflow: Capture → Validate → Script → Captions → Post.

### Target User

Short-form video creators across all niches (tech, fitness, food, travel, business, gaming, etc.) who publish on Instagram, Instagram Reels, LinkedIn, and YouTube Shorts. The prompt system has a particular emphasis on Indian creators (Tier 1–3 audiences, Hinglish nuance) but works for any English-speaking creator.

---

## 2. The Six Core Tools

### 2.1 Vault (Idea Capture & Management)

**Route:** `/vault`
**Purpose:** Capture raw ideas the moment they hit. Type, speak, or paste.

**How it works:**
- User submits raw text via a capture bar.
- The server immediately saves the idea with status `raw` and returns it.
- A fire-and-forget async process calls Groq (Llama 3.3 70B) to auto-tag the idea:
  - `tags`: 2–3 lowercase category strings
  - `format_type`: best content format (story, talking head, listicle, tutorial, rant, hot take)
  - `emotion_angle`: primary emotional angle (frustration, inspiration, curiosity, nostalgia, pride)
  - `potential_score`: "high" (specific, personal, counterintuitive), "medium", or "low" (vague/generic)
- The client polls every 2 seconds (up to 30 seconds) until tags appear.
- Ideas can be filtered by score, format, and status.
- Each idea card shows tags, format, emotion, and a color-coded potential score.
- From any idea card, the user can click "Validate" to open Studio with that idea pre-filled.

**Statuses:** `raw` → `tagged` (after AI tagging) → `developed` (after script generation) → `used`

### 2.2 Studio (Idea Validation)

**Route:** `/studio`
**Purpose:** Validate an idea against real YouTube and Instagram data before filming.

**How it works:**
- User enters an idea (or it's pre-filled from Vault).
- The server fetches real YouTube Data API v3 results (up to 10 deduplicated videos across multiple keyword searches).
- The server fetches Instagram hashtag data via RapidAPI (`instagram-hashtags` endpoint).
- All data is fed into a Groq prompt that produces a comprehensive `InsightReport` (13 sections).
- The report includes real view counts, channel names, title patterns — not generic advice.

**InsightReport sections:**
1. Trend direction (rising/peaked/declining/stable), score (0–100), velocity
2. Competition level + saturation warning
3. Audience fit (score, primary audience demographic, intent, best posting times/days)
4. Executive summary + opportunity score (0–100 composite)
5. Top angles (3–5) with estimated reach and difficulty ratings
6. Untapped angles (2–3) with gap analysis
7. Platform analysis (Instagram Reels + YouTube Shorts potential, avg views, content style, hashtag strategy)
8. YouTube data (real numbers: top video views, average of top 5, total found, view range, top channels, common title patterns)
9. Content blueprint (opening hook, core message, key points with timestamps, CTA, visual/audio notes, duration target)
10. Competitor insights (observations + gaps)
11. Risks (3–4 specific risks)
12. Recommendations (4–5 actionable steps)
13. Key insight + verdict label ("Strong opportunity" / "Good opportunity" / "Proceed with caution" / "Avoid for now") + verdict reason

**Navigation:** From Studio, the user clicks "Plan Your Script" → navigates to Develop with `{ idea, ideaId, insights: InsightReport }` passed via React Router navigation state.

### 2.3 Develop (Script Planning)

**Routes:** `/develop` and `/develop/:ideaId` (direct link to develop a specific idea)
**Purpose:** Generate psychologically-grounded hooks and timestamped scripts.

**Two-step generation flow:**

**Step 1 — Hook Generation:**
- Server generates exactly 3 hook variants, each using a different psychological trigger.
- Triggers: Curiosity Gap, Identity Threat, Controversy, Surprising Stat, Personal Story Angle, Pattern Interrupt.
- Hooks are inspired by a library of 180+ proven viral hook templates, categorized as: educational, comparison, myth_busting, storytelling, authority, day_in_the_life, random.
- The template selection is keyword-scored against the idea to pick the most relevant categories.
- Templates are injected into the prompt as structural inspiration — the LLM adapts patterns, never copies verbatim.

**Step 2 — Script from Hook:**
- User picks a hook → server generates the full script body.
- Script contains 5 beats with timestamps (targeting 45–60 seconds), a CTA, and a word count (200–300 words).
- Beats are tonally consistent with the selected hook's psychological trigger.
- Platform-specific tone guidance is injected (Reels = casual/personal, YouTube Shorts = slightly more informational).

**Additional capabilities:**
- "Try another hook" — regenerates a single hook slot using an unused trigger.
- "Regenerate script" — regenerates beats/CTA with optional creator feedback.
- "Save to Vault" — persists the idea with hooks and developed status.

**Navigation:** From Develop, the user clicks "Generate Captions" → navigates to Amplify with `{ idea, ideaId }` via navigation state.

### 2.4 Amplify (Conversational Caption Generation)

**Route:** `/amplify`
**Purpose:** Multi-turn conversational caption generation with per-platform hashtag intelligence.

**How it works:**
- The user types a prompt (or it's auto-sent when navigating from Develop).
- The user selects target platforms (Instagram, LinkedIn, Reels, YouTube Shorts).
- The user optionally selects caption length (short: 1–2 lines, medium: 4–5 lines, long: 2–3 paragraphs).
- The server:
  1. Fetches the user's creator profile (niche, sub_niche).
  2. Loads conversation history from the database.
  3. Fetches hashtag intelligence (YouTube trends + RapidAPI Instagram data + Groq synthesis).
  4. Builds a platform-aware system prompt with per-platform writing rules, length constraints, and hashtag pools.
  5. Calls Groq with the full conversation history + system prompt.
  6. Returns a `CaptionResult` with individual captions per platform, each with text and hashtags.

**Platform-specific writing rules (enforced in the prompt):**
- Instagram feed: Personal, first-person, conversational. Hook line that stops the scroll. Ends with a question.
- Instagram Reels: Ultra-short caption (1–2 punchy lines). The video does the talking.
- LinkedIn: Professional but human. Bold opening statement. Line breaks for readability. Ends with a question.
- YouTube Shorts: Caption = video title/description. Keyword-rich for search. 1–2 sentences.

**Hashtag rules:**
- Instagram/Reels: 8–12 hashtags, prioritize mid-volume (500K–3M posts), avoid 10M+ tags.
- LinkedIn: 3–5 professional topic hashtags only.
- YouTube Shorts: 3–5 broad category hashtags + always #shorts.

**Conversations:**
- Conversations are persisted server-side in the `amplify_conversations` table.
- Each conversation has a title, messages array (JSONB), and timestamps.
- The sidebar shows all past conversations; users can switch between them or start new ones.
- Full conversation history is sent to Groq on each turn for multi-turn context.

### 2.5 Settings (Creator Profile)

**Route:** `/settings`
**Purpose:** Configure the creator profile that personalizes every AI generation.

**Fields:** Display name, Niche, Sub-niche, Language preference, Platform priority.

**Onboarding:** New users complete a 4-step wizard before accessing the app:
1. Display name
2. Niche selection (grid picker)
3. Sub-niche (optional, free text)
4. Platform priority (optional, multi-select)

The profile is stored server-side and injected into every Groq prompt.

### 2.6 Insights (Dedicated Insight View)

**Route:** `/insights/:ideaId`
**Purpose:** Display a full InsightReport for a previously validated idea.

Loads the idea by ID and renders its cached InsightReport with rich UI components (score bars, section headers, skeleton loading states). Provides a dedicated read-only view outside of the Studio flow.

---

## 3. Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (dev server + build)
- React Router v7 (client-side routing)
- Inline styles + CSS variables (no CSS framework — fully custom design system)
- Vitest + React Testing Library + fast-check (property-based testing) for tests

### Backend
- Node.js + Express + TypeScript
- ts-node + nodemon (development)
- PostgreSQL via Supabase (connection pooler)
- Groq SDK (Llama 3.3 70B Versatile model)
- JWT authentication (bcryptjs + jsonwebtoken)
- YouTube Data API v3
- RapidAPI (instagram-hashtags, top-instagram-hashtag)
- Helmet (security headers)
- express-rate-limit (rate limiting)
- xml2js (YouTube transcript parsing)
- Vitest + fast-check (property-based testing) for tests

### Database
PostgreSQL (Supabase). Connection pool limited to 3 connections (Supabase free tier constraint) with 30s idle timeout and 5s connection timeout. Schema managed via `initDb()` — `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS` migrations that run on every server start.

---

## 4. Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| email | TEXT UNIQUE NOT NULL | Lowercased on signup |
| password_hash | TEXT NOT NULL | bcrypt, 12 rounds |
| name | TEXT NOT NULL | Display name |
| created_at | BIGINT NOT NULL | Unix ms |
| niche | TEXT | Creator's content niche |
| sub_niche | TEXT | Refinement of niche |
| language | TEXT DEFAULT 'English' | Language preference |
| platform_priority | JSONB DEFAULT '[]' | Ordered platform list |
| onboarding_complete | BOOLEAN DEFAULT FALSE | Gate for main app access |

### ideas
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| user_id | TEXT FK → users(id) ON DELETE CASCADE | Owner |
| raw_text | TEXT NOT NULL | The raw idea |
| created_at | BIGINT NOT NULL | Unix ms |
| tags | JSONB | AI-generated tags array |
| format_type | TEXT | AI-suggested format |
| emotion_angle | TEXT | AI-detected emotion |
| potential_score | TEXT | "low" / "medium" / "high" |
| hooks | JSONB | Generated hook variants |
| captions | JSONB | Generated captions by platform |
| selected_hook | TEXT | User's chosen hook text |
| status | TEXT DEFAULT 'raw' | raw → tagged → developed → used |
| insights | JSONB | Cached InsightReport |
| insights_cached_at | BIGINT | When insights were cached |

### amplify_conversations
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| user_id | TEXT FK → users(id) ON DELETE CASCADE | Owner |
| title | TEXT NOT NULL | Conversation title |
| messages | JSONB DEFAULT '[]' | Array of {role, content, timestamp} |
| created_at | BIGINT NOT NULL | Unix ms |
| updated_at | BIGINT NOT NULL | Unix ms |

### api_cache
| Column | Type | Notes |
|---|---|---|
| cache_key | TEXT PK | SHA-256 hash of request params |
| namespace | TEXT NOT NULL | Cache category |
| payload | JSONB NOT NULL | Cached response |
| created_at | BIGINT NOT NULL | Unix ms |
| expires_at | BIGINT NOT NULL | Unix ms, 7-day TTL default |

### usage_limits
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| user_id | TEXT FK → users(id) | |
| action | TEXT | "insights" / "amplify" / "studio" |
| date | TEXT | "YYYY-MM-DD" UTC |
| count | INTEGER | Requests today |
| UNIQUE(user_id, action, date) | | Upsert-safe |

### Database Indexes
| Index | Table | Columns | Purpose |
|---|---|---|---|
| `api_cache_namespace_idx` | api_cache | namespace | Fast namespace-scoped lookups |
| `api_cache_expires_idx` | api_cache | expires_at | Efficient TTL cleanup |
| `usage_limits_user_date_idx` | usage_limits | user_id, date | Fast per-user daily usage queries |

---

## 5. API Surface

### Health Check
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | No | Returns `{ status: "ok", ts: <unix_ms> }` for uptime monitoring |

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | No | Create account (email, password, name) |
| POST | /api/auth/login | No | Login, returns JWT (7-day expiry) |
| GET | /api/auth/me | Yes | Get authenticated user |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/users/me | Yes | Full user profile |
| PATCH | /api/users/me | Yes | Update profile fields |
| DELETE | /api/users/me | Yes | Delete account (cascades) |

### Ideas (Vault)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/ideas | Yes | List all ideas (filterable by score, format, status) |
| POST | /api/ideas | Yes | Create idea + fire-and-forget AI tagging |
| GET | /api/ideas/:id | Yes | Get single idea |
| PATCH | /api/ideas/:id | Yes | Update idea fields |
| DELETE | /api/ideas/:id | Yes | Delete idea |

### Insights (Studio validation)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/insights?idea=&niche=&ideaId= | Yes | Generate or retrieve cached InsightReport |

### Studio (Hook + Script generation)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/studio/hooks | Yes | Generate 3 hook variants |
| POST | /api/studio/script | Yes | Generate script from selected hook |
| POST | /api/studio/regenerate | Yes | Regenerate hook or script with feedback |

### Amplify (Caption generation)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/amplify | Yes | Generate platform-native captions |

### Conversations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/conversations | Yes | List all conversations (no messages) |
| GET | /api/conversations/:id | Yes | Get conversation with messages |
| POST | /api/conversations | Yes | Create new conversation |
| PATCH | /api/conversations/:id | Yes | Append messages |
| DELETE | /api/conversations/:id | Yes | Delete conversation |

### Trending
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/trending | No | Top Instagram hashtags (RapidAPI, cached 2 days) |

### Usage
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/usage | Yes | Today's usage for all tracked actions |

### Legacy Routes (pre-Studio/Amplify architecture, still active)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/generate | Yes | Generate captions for multiple platforms at once |
| POST | /api/regenerate/:platform | Yes | Regenerate caption for a single platform |
| POST | /api/hooks | Yes | Generate 5 hooks with viral templates (creates idea if none exists) |
| POST | /api/captions | Yes | Generate caption from hook + idea for a single platform |
| POST | /api/captions/regenerate | Yes | Regenerate a caption with feedback |
| POST | /api/transcript | Yes | Extract YouTube video transcript from URL |

---

## 6. AI Prompt Architecture

### Model
All AI calls use Groq's `llama-3.3-70b-versatile` model.

### Prompt Design Principles
1. Every prompt receives the creator's profile (niche, sub_niche, language, platform_priority) when available.
2. Prompts enforce strict output format (JSON with exact shapes). The first character must be `{`.
3. Prompts include anti-pattern rules: no filler phrases ("In today's world", "Have you ever"), no generic motivational content.
4. Platform-specific tone guidance is injected per-platform (Reels vs YouTube Shorts vs Instagram vs LinkedIn).
5. Real data (YouTube view counts, Instagram post volumes) is injected into prompts for data-grounded outputs.

### Prompt Files
| File | Purpose | Output |
|---|---|---|
| `ideaTagging.ts` | Auto-tag ideas on save | `{ tags, format_type, emotion_angle, potential_score }` |
| `insightSynthesis.ts` | Full idea validation with real YouTube data | `InsightReport` (13 sections) |
| `studio.ts` | Hook variant generation + script-from-hook | `{ hook_variants }` or `{ beats, cta, word_count }` |
| `hooks.ts` | Legacy hook generation (5 hooks with viral templates) | `Hook[]` |
| `hookTemplates.ts` | 180+ viral hook templates with keyword-based category scoring | Template selection for prompt injection |
| `amplify.ts` | Platform-native caption generation with hashtag intelligence | `CaptionResult` |
| `captionWithHook.ts` | Legacy single-platform caption from hook + idea, with regeneration support | Formatted caption text |
| `instagram.ts` | Instagram feed post prompt | Formatted post text |
| `linkedin.ts` | LinkedIn post prompt | Formatted post text |
| `reels.ts` | Instagram Reels script prompt (beat map: Hook → Stakes → Build → Wait What → Payoff → Exit) | Structured script |
| `youtubeShorts.ts` | YouTube Shorts script prompt (Hook → Core → Payoff → CTA → Hashtags) | Structured script |

### Psychological Triggers (used in hook generation)
1. Curiosity Gap — tease something without revealing it
2. Identity Threat — challenge the reader's self-image or beliefs
3. Controversy — take a polarizing stance
4. Surprising Stat — lead with an unexpected number or fact
5. Personal Story Angle — open with a specific personal moment
6. Pattern Interrupt — break the reader's mental autopilot

### Viral Hook Template System
- 180+ templates organized into 7 categories: educational, comparison, myth_busting, storytelling, authority, day_in_the_life, random.
- When generating hooks, the system scores each category against the idea using keyword regex matching.
- Top 2–3 categories are selected, templates are shuffled, and 6–12 are injected into the prompt as "structural inspiration."
- The LLM adapts the pattern/rhythm to the specific idea — never copies verbatim.

### Groq Rate Limit Handling
- Exponential backoff with jitter on 429 (rate limit) and 5xx errors.
- Retry schedule: 1s, 2s, 4s, 8s + random jitter up to 500ms.
- Max 4 retries. Client errors (400, 401) are not retried.

---

## 7. Caching Strategy

### Two-Layer Cache

**Layer 1: In-memory TTL cache** (`cache.ts`)
- Lightweight `Map`-based cache with configurable TTL and max size.
- Instances: hashtagCache (6h), studioHooksCache (1h), studioScriptCache (1h), youtubeCache (3h).

**Layer 2: Database cache** (`dbCache.ts` → `api_cache` table)
- SHA-256 hashed keys from sorted JSON params.
- 7-day default TTL.
- Expired rows purged on server startup and every 6 hours.

### Cached Namespaces
| Namespace | What's cached | TTL |
|---|---|---|
| `youtube_search` | YouTube Data API search results | 7 days |
| `hashtag_intelligence` | Per-platform hashtag strategy (YouTube + RapidAPI + Groq) | 7 days |
| `studio_hooks` | Hook variants for idea + profile | 7 days |
| `studio_script` | Script body for hook | 7 days |
| `insights` | Full InsightReport | 7 days |
| `rapidapi_instagram_hashtags` | RapidAPI instagram-hashtags results | 7 days |
| `rapidapi_top_hashtags_global` | RapidAPI top-instagram-hashtag results | 2 days |

### Idea-Level Cache
InsightReports are also cached directly on the `ideas` table (`insights` JSONB column + `insights_cached_at` timestamp). This allows instant loading of previously validated ideas without hitting the `api_cache` table.

---

## 8. Security Model

### Authentication
- JWT tokens with 7-day expiry.
- Passwords hashed with bcrypt (12 rounds).
- Emails lowercased and validated with regex on signup.
- All protected routes use `requireAuth` middleware that extracts `userId` and `userEmail` from the JWT.

### Input Sanitization
- Global middleware sanitizes all request bodies recursively.
- Prompt injection detection: regex patterns catch common jailbreak attempts.
- Field-level max lengths enforced (prompt: 2000 chars, name: 80, email: 254, etc.).
- Injection attempts are logged with IP and rejected with 400.
- Query parameters are also sanitized for GET requests.

### Rate Limiting
| Endpoint Group | Window | Max Requests |
|---|---|---|
| Auth (signup/login) | 15 min | 10 per IP |
| AI endpoints (amplify, studio, insights) | 1 min | 15 per IP |
| General API (ideas, conversations, users) | 1 min | 60 per IP |
| Trending (public) | 1 min | 30 per IP |

### Per-User Daily Limits (DB-backed)
| Action | Daily Limit | Notes |
|---|---|---|
| insights | 2 | Idea validations (YouTube + Instagram + Groq + RapidAPI) |
| amplify | 5 | Caption generations (RapidAPI + Groq) |
| studio | 5 | Hook/script generations (Groq) |

Cache hits do not count against limits — only fresh external API calls burn quota.

### Other Security
- Helmet for security headers.
- CORS locked to allowed origins (default: `http://localhost:5173`).
- Body size limit: 50KB.
- Ownership verification on all data access (ideas, conversations verified against `userId`).
- Stack traces hidden in production error responses.

---

## 9. Hashtag Intelligence Pipeline

When generating captions, Hookd builds a real-time hashtag strategy:

1. **YouTube Data API** — Search for the topic, extract hashtags from video titles, descriptions, and tags.
2. **RapidAPI instagram-hashtags** — Fetch related Instagram hashtags with real post counts. Categorize into tiers: high (3M+), mid (500K–3M), niche (50K–500K), micro (<50K).
3. **Groq synthesis** — Feed all data into a Groq prompt with platform-specific hashtag strategy rules.
4. **Merge & deduplicate** — Combine RapidAPI validated tags with Groq-synthesized tags, prioritizing real data.
5. **Inject into caption prompt** — The final hashtag pools are injected into the Amplify system prompt.

---

## 10. Client Architecture

### Routing
React Router v7 with navigation state for inter-page data passing.

| From → To | State Passed |
|---|---|
| Vault → Studio | `?ideaId=` query param |
| Vault → Insights | `/insights/:ideaId` URL param |
| Studio → Develop | `{ idea, ideaId, insights: InsightReport }` |
| Develop → Amplify | `{ idea, ideaId }` |

### Key Custom Hooks
| Hook | Purpose |
|---|---|
| `useVault` | Idea CRUD + polling for async AI tagging |
| `useStudio` | Two-phase hook/script generation state machine |
| `useDevelop` | Legacy hook + caption generation flow |
| `useAmplify` | Conversation management + caption generation |
| `useConversations` | CRUD for Amplify conversation sessions |
| `useCreatorProfile` | Fetch/cache creator settings |
| `useSettings` | Settings form state management |
| `useClipboard` | Copy-to-clipboard utility |
| `useTrending` | Fetch trending hashtags |

### Design System
- No CSS framework. All styles are inline with CSS variables.
- Dark/light theme via `data-theme` attribute on `<html>`.
- CSS variables for colors: `--bg`, `--bg-card`, `--bg-subtle`, `--text`, `--text-2`, `--text-3`, `--text-4`, `--accent`, `--border`, `--error`, etc.
- Responsive breakpoints at 860px and 600px.
- Animations: `fade-up`, `pulse-glow` keyframes.

### Auth Context
- `AuthProvider` wraps the entire app.
- Stores JWT in `localStorage`.
- Provides `user`, `loading`, `login`, `signup`, `logout`, `refreshProfile`.
- `ProtectedRoute` component gates access; `requireOnboarding` flag redirects incomplete profiles.

### Theme System
- `ThemeContext` exported from `App.tsx` provides `{ dark: boolean, toggle: () => void }`.
- Theme preference persisted in `localStorage` under key `"theme"`.
- Falls back to `prefers-color-scheme: dark` media query on first visit.

### Error Handling
- `ErrorBoundary` component wraps the entire app inside `AuthProvider`.
- Catches React render errors and displays a fallback UI instead of a white screen.

### Key Client Types
Defined in `src/types/index.ts`:
- `User` — full user profile shape
- `ConversationMessage` — `{ role, content, timestamp }`
- `ConversationSession` — conversation metadata + optional messages array
- `ScriptBeat` — `{ timestamp, text }`
- `Script` — full script object (format, selected_hook, hook_variants, beats, cta, word_count)
- `AuthResponse` — `{ token, user }`
- `Idea` — includes `selected_hook`, `insights`, and `insights_cached_at` fields

---

## 11. External API Dependencies

| API | Purpose | Rate/Cost Sensitivity |
|---|---|---|
| Groq (Llama 3.3 70B) | All AI generation | Free tier: ~30 req/min, ~14,400 req/day |
| YouTube Data API v3 | Real video data for idea validation + hashtag extraction | Quota-limited (10,000 units/day default) |
| RapidAPI instagram-hashtags | Topic-specific Instagram hashtag data with post counts | Pay-per-request (~30/month budget) |
| RapidAPI top-instagram-hashtag | Globally trending Instagram hashtags | Pay-per-request |
| YouTube Innertube API | YouTube video transcript extraction (unofficial) | No quota cost |

---

## 12. Environment Variables

```
GROQ_API_KEY          — Groq API key (required)
DATABASE_URL          — PostgreSQL connection string (required)
JWT_SECRET            — JWT signing secret (required in production)
YOUTUBE_API_KEY       — YouTube Data API v3 key
RAPIDAPI_KEY          — RapidAPI key (instagram-hashtags + top-instagram-hashtag)
PORT                  — Server port (default: 3001)
ALLOWED_ORIGINS       — Comma-separated CORS origins (default: http://localhost:5173)
NODE_ENV              — "production" or "development"
```

---

## 13. Key Design Decisions

1. **Navigation state over URL params** — Data between pages is passed via React Router state to keep URLs clean.
2. **Fire-and-forget tagging** — Idea creation returns immediately; AI tagging happens async.
3. **Two-phase script generation** — Hooks first (3 variants), then full script around the chosen hook.
4. **Per-platform caption generation** — Each platform gets a completely different caption with platform-native rules.
5. **Viral hook template injection** — Proven viral patterns injected into prompts as structural inspiration.
6. **DB-backed usage limits** — Daily limits tracked per-user in the database. Cache hits don't count.
7. **Aggressive caching** — Every expensive API call cached for 7 days. InsightReports cached on both `api_cache` table and directly on the idea row.
8. **Prompt injection defense** — All user input scanned for common LLM jailbreak patterns.
9. **Startup validation** — Server validates required env vars before starting. Missing vars cause `process.exit(1)`.

---

## 14. YouTube Transcript Service

The transcript service (`services/transcript.ts`) extracts captions from YouTube videos without using the official YouTube Data API quota:

1. Fetches the YouTube video page HTML to extract the `INNERTUBE_API_KEY`.
2. Calls the Innertube player API impersonating an Android client to get caption track URLs.
3. Prefers English manual captions → English auto-generated → first available language.
4. Fetches the caption XML and parses it via `xml2js` into plain text.
5. Supports both `youtube.com/watch?v=` and `youtu.be/` URL formats.

Exposed via `POST /api/transcript`.
