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
**Purpose:** Validate an idea against real YouTube and Google Trends data before filming.

**Validation flow:**
1. User enters an idea (or it's pre-filled from Vault via `?ideaId=` param).
2. On "Validate" click: idea is saved to Vault (fire-and-forget), then clarity is assessed.
3. **Idea Clarifier:** `POST /api/studio/clarify` — Groq call to check if idea is specific enough. If vague, shows 1–3 domain-focused clarifying questions inline with clickable chip options + free text. If clear, skips to validation.
4. After clarification (or skip), the expanded query is sent to `GET /api/insights`.

**Data pipeline (insights route):**
1. Cache check: idea-level (ideas table) → exact hash (api_cache) → keyword-normalized (intent match).
2. YouTube Data API v3: two searches per idea — `order=relevance` (top performers) + `order=date` (recent uploads). Up to 15 deduplicated videos.
3. SerpAPI Google Trends (geo: India): Interest Over Time (12-month timeline) + Related Queries (rising + top). Falls back to RapidAPI Google Trends. Smart keyword extraction from idea text (strips filler, tries multiple candidates).
4. Computed Signals Engine (`computedSignals.ts`): pure math from YouTube + Google Trends data. Computes trend direction, velocity, score, competition level, opportunity score, audience fit score. No LLM involved.
5. Groq synthesis: receives real data + computed signals as facts. LLM explains and generates angles/blueprint/risks — but numeric scores are force-overwritten with computed values after response.

**Fallback stack** (graceful degradation when external APIs fail):

| Level | Condition | Behavior |
|---|---|---|
| Live Mode | All APIs respond | Normal report with full data |
| Cached Mode | YouTube / Google Trends API fails | Serve from `api_cache` (exact hash or fuzzy keyword match) |
| AI Estimate Mode | All external APIs fail | Groq receives niche + idea text only → generates estimated report (`aiEstimate.ts`) |

The active mode is never exposed to the user — the best available data is served silently.

**Validation report UI — dashboard layout (after clicking Validate):**

The report renders in a premium dashboard layout with a hero bar, stat strip, and two-column grid:

**Hero bar:** Source badges (YouTube, Google Trends, AI Interpretation) on the left + Revalidate / Plan Your Script CTAs on the right.

**4-column stat strip:** Verdict label, Opportunity score (/100), Competition level, Trend direction — plus (when computed signals are available) Momentum, Recent Uploads, Search Interest (/100), and Audience Fit (/100). All color-coded as HeroStat cards in a unified grid. Up to 8 tiles in a 4-column layout.

**Left column (main content):**
1. **VerdictCard** — verdict label + reason + context badges (audience intent, competition, best days/times) + key insight
2. **PlatformScorecard** — Instagram Reels + YouTube Shorts tier labels (Excellent/Strong/Moderate/Low) with reasons
3. **Strategy & Angles** (tabbed panel) — Tabs: Angles / Untapped / Risks / Competitors / Action Plan. Only tabs with data are shown.
4. **Evidence & Data** (ResearchPanel) — YouTube stats grid, top channels, title patterns, video tiles with Watch → links
5. **Google Search Trends** (SearchTrendsSection) — 12-month sparkline chart, interest stats, rising/top query chips

**Right column (sticky sidebar):**
- Quick Summary (key insight)
- Best Platform (with tier badge)
- Best Time to Post
- Top Channel Spotted
- Opportunity + Audience Fit circle graphs (/100)
- Plan Your Script CTA button

The sidebar sticks to the viewport while scrolling (top: 72px to clear the navbar). On tablet/mobile, the layout collapses to a single column.

**Computed signals (all from real data, no LLM):**
- Trend direction: recent (6mo) vs older video view ratios
- Trend velocity: median views/day (high/medium/low)
- Trend score (0–100): 40% recency + 40% views/day + 20% upload frequency, boosted by Google Trends
- Competition: video count × channel diversity × dominance ratio
- Opportunity (0–100): 30% trend + 25% inverse competition + 25% view strength + 20% momentum
- Audience fit (0–100): 45% demand + 30% diversity + 25% consistency

**Caching:**
- 3-layer cache: idea-level (ideas table) → exact hash (api_cache) → keyword-normalized (intent match)
- Keyword normalization: strips stop words, sorts alphabetically, dedupes — "rich habits of Indians" and "money habits wealthy Indians" can share cache
- YouTube results cached 7 days per query+order combo
- SerpAPI Google Trends cached 7 days per keyword
- Fuzzy cache requires ≥50% keyword overlap + ≥2 matching keywords (prevents cross-contamination)

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
- Navigating to Amplify (from navbar or from Develop) always starts a fresh conversation — never resumes the last one.

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

### 2.7 Instagram Intelligence Layer

**Purpose:** Layer Instagram Reels-specific intelligence on top of the existing Studio validation, giving creators actionable signals for filming, hooking, captioning, and hashtagging — all without disrupting any existing flow.

**Core type — `InstagramSignals`** (defined in `server/src/types/instagram.ts`, mirrored in `client/src/api/insights.ts`):

```ts
interface InstagramSignals {
  reelPotential:  { score: number; label: "High" | "Medium" | "Low" }
  hookStrength:   { score: number; label: "Strong" | "Moderate" | "Weak" }
  saveability:    { score: number; label: "High" | "Medium" | "Low" }
  saturation:     { score: number; label: "High" | "Medium" | "Low" }
  bestFormat:     string
  captionStyle:   string
  hookIdeas:      string[]   // 3 scroll-stopping hooks
  hashtagPack:    string[]   // 8–12 mixed tags
}
```

**Signal computation** (all deterministic, in `server/src/services/instagramIntelligence.ts`):

| Signal | Inputs | Formula / Logic |
|---|---|---|
| Reel Potential | opportunity, trend, audience fit, niche demand (Google Trends) | 40% opportunity + 30% trend + 20% audience fit + 10% niche demand. Labels: High ≥65, Medium ≥35, Low <35 |
| Hook Strength | idea text regex matching | Strong triggers: curiosity, pain point, money, mistake, secret, transformation, controversy, numbers, specific claims. Weak triggers: daily vlog, random motivation, generic tips, grwm, storytime. Bonus for specificity (numbers, sweet-spot length) |
| Saveability | idea text regex matching | High for educational / checklist / finance / tools / systems / mistakes / how-to / recipes / routines. Low for entertainment / vlog / comedy / prank / challenge / rant |
| Saturation | competition level, totalVideos, channel dominance | Derived from existing computed signals. Boosted if top video views exceed 1M (dominant players) |

**Hook Generator:** Single Groq LLM call produces 3 scroll-stopping hooks (under 15 words each, psychological triggers, Indian creator friendly, no filler). Deterministic template-based fallback if Groq fails.

**Best Reel Format Engine** (deterministic keyword matching):

| Keywords | Format |
|---|---|
| AI / tools / software | Screen Recording |
| Transformation / before-after | Before / After Style |
| Story / journey / experience | Voiceover Story |
| Lists / tips / steps / comparisons | Carousel Reel |
| Finance / money / data | Faceless B-roll |
| News / controversy / opinion | Green Screen Commentary |
| Default | Talking Head |

**Caption Style Engine** (deterministic keyword matching): Returns one of Bold, Curious, Authority, Personal, Minimal, Storytelling.

**Hashtag Pack:** Uses `hashtagBank.json` + idea keyword extraction. Returns 8–12 deduplicated tags: 3 broad (reels, reelsinstagram, explorepage) + 5 mid (niche-specific from hashtagBank) + 2–4 niche (extracted from idea keywords).

**Route integration:** Instagram signals run in `Promise.all` alongside the existing synthesis pipeline in `server/src/routes/insights.ts`. Merged into the response payload as the `instagram` field. No sequential slowdown.

**Prompt enhancement:** `server/src/prompts/insightSynthesis.ts` enhanced with Instagram Reels platform scoring guidance (save-worthiness, hook potential, visual appeal) and Reels-first content blueprint opening hooks. Existing metrics and computed signal overrides unchanged.

**Frontend — Instagram Playbook card** (`client/src/components/InstagramPlaybook.tsx`):

Inserted after `PlatformScorecard` in the Studio report. Contains:
- **4-column stat grid** (responsive to 2-col on mobile): Reel Potential, Hook Strength, Saveability, Saturation — each with mini score ring + label badge.
- **Hooks section:** 3 numbered hooks with copy button + lightning button (navigates to Develop with hook pre-selected).
- **Format + Caption Style:** Side-by-side 2-column grid with VideoCamera and TextAa icons.
- **Hashtag Pack:** Clickable copy tags + "Copy All" button.
- Card styled with Instagram gradient header, Reels badge, matching existing design system.

**Sidebar additions:** After "Top Channel Spotted" — Reel Potential (score/100 + label badge), Best Format, Caption Style.

**Develop integration:** Lightning button on a hook navigates to `/develop` with `selectedHook` in navigation state. Develop screen displays the selected hook as a banner above the idea input. No hook selected = existing behavior unchanged.

**Amplify integration:**
- `server/src/prompts/amplify.ts` accepts optional `instagram_context` parameter — injects best format, caption style, hashtag pack, and hook tone into the system prompt.
- `server/src/routes/amplify.ts` accepts `instagram_context` from request body and passes it through.

**Files created:**
- `server/src/types/instagram.ts`
- `server/src/services/instagramIntelligence.ts`
- `client/src/components/InstagramPlaybook.tsx`

**Files modified:**
- `server/src/routes/insights.ts` — parallel Instagram signals
- `server/src/prompts/insightSynthesis.ts` — Reels scoring guidance
- `server/src/prompts/amplify.ts` — instagram_context parameter
- `server/src/routes/amplify.ts` — accepts instagram_context
- `client/src/api/insights.ts` — InstagramSignals type + instagram field
- `client/src/screens/StudioScreen.tsx` — Playbook card + sidebar items
- `client/src/screens/DevelopScreen.tsx` — selectedHook display

### 2.8 Market Intelligence Scoring

**Purpose:** Fix false-negative scoring for feed-driven niches (skincare, beauty, fitness, fashion, lifestyle, food, motivation, relationships) where low Google Trends search volume was incorrectly penalizing strong creator categories. The scoring engine now classifies the market type first, then weights signals accordingly.

**Market Type Classifier** (`server/src/services/marketClassifier.ts`):

Every validation request classifies the idea into one of five market types using niche maps (30+ niches), keyword patterns, and idea text:

| Market Type | Description | Examples |
|---|---|---|
| `search_driven` | People intentionally search for solutions | best mutual funds, coding roadmap, passport process |
| `feed_driven` | People discover passively in reels/feed | skincare habits, gym glow up, room decor ideas |
| `hybrid` | Both search + feed discovery | fat loss tips, personal finance habits, AI tools for creators |
| `trend_driven` | Momentum / news based | IPL moments, celebrity controversy, viral meme trend |
| `authority_driven` | Creator personality matters most | mindset lessons, founder advice, storytime |

Falls back to `hybrid` if classification fails (safe default).

**Discovery Demand Signal** (`server/src/services/discoverySignals.ts`):

New internal metric `discoveryDemand: 0–100` measuring likelihood of succeeding through feed distribution. Uses niche creator volume, repeated successful formats, visual niche strength, save/share potential, emotional triggers, reel-native compatibility, and topic evergreenness. Computed via niche base scores + content signal bonuses from idea text.

**Market-Aware Scoring Weights** (`server/src/services/scoringWeights.ts`):

| Market Type | Search Demand | Discovery Demand | Competition | Audience Fit / Other |
|---|---|---|---|---|
| Search Driven | 50% | 20% | 20% | 10% Audience Fit |
| Feed Driven | 20% | 50% | 20% | 10% Audience Fit |
| Hybrid | 35% | 35% | 20% | 10% Audience Fit |
| Trend Driven | 20% | 20% | — | 40% Momentum + 20% Speed Window |

**Competition interpretation upgrade:** For feed-driven niches, high competition no longer heavily penalizes opportunity. Instead it signals "validated demand + differentiation required" — competitive but healthy.

**Trend direction fix:** For feed-driven niches, low Google Trends maps to "Low search intent" rather than "Declining niche." Google Trends is a strong signal only for search-driven niches.

**New internal labels** for feed-driven niches (injected via LLM prompt): Evergreen category, Strong creator demand, Mature niche, High replay potential, Packaging dependent, Competitive but healthy.

**Prompt integration:** `insightSynthesis.ts` receives market type, discovery demand score, and scoring rationale. Prompt rules prevent over-indexing search volume for feed-driven niches and explain opportunity via creator demand + packaging.

**UI:** Color-coded market type chip displayed in the hero bar (e.g., "Feed-Driven Market", "Hybrid Market"). No layout changes — existing report structure preserved.

**Example — before vs after** for "7 skincare habits that make you look fresher":

| | Before | After |
|---|---|---|
| Verdict | Proceed with caution | Strong recurring category |
| Opportunity | 44 | 72 |
| Trend | Declining | Search Intent Low, Reel Demand High |
| Competition | — | Competitive but healthy |

**Files created:**
- `server/src/services/marketClassifier.ts` — market type classification (niche map + keyword patterns)
- `server/src/services/discoverySignals.ts` — discovery demand scoring
- `server/src/services/scoringWeights.ts` — market-aware weight engine

**Files modified:**
- `server/src/prompts/insightSynthesis.ts` — market type + discovery demand injection
- `client/src/screens/StudioScreen.tsx` — market type chip in hero bar

---

## 3. Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (dev server + build)
- React Router v7 (client-side routing)
- Framer Motion (animations, accordion transitions, staggered reveals)
- @phosphor-icons/react (icon library — replaces inline SVGs and emojis)
- Recharts (sparkline charts for Google Trends)
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
| insights_idea_text | TEXT | Exact idea text that generated the cached insights |

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
| metadata | JSONB | Optional metadata for fuzzy cache lookup (niche, keywords) |

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
| POST | /api/studio/clarify | Yes | Assess idea clarity, return clarifying questions if vague |
| POST | /api/studio/hooks | Yes | Generate 3 hook variants (falls back to template-based hooks on Groq failure) |
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
| `insightSynthesis.ts` | Full idea validation with real YouTube data + computed signals | `InsightReport` (LLM explains, computed signals override scores) |
| `studio.ts` | Hook variant generation + script-from-hook | `{ hook_variants }` or `{ beats, cta, word_count }` |
| `hooks.ts` | Legacy hook generation (5 hooks with viral templates) | `Hook[]` |
| `hookTemplates.ts` | 180+ viral hook templates with keyword-based category scoring | Template selection for prompt injection |
| `amplify.ts` | Platform-native caption generation with hashtag intelligence | `CaptionResult` |
| `captionWithHook.ts` | Legacy single-platform caption from hook + idea, with regeneration support | Formatted caption text |
| `instagram.ts` | Instagram feed post prompt | Formatted post text |
| `linkedin.ts` | LinkedIn post prompt | Formatted post text |
| `reels.ts` | Instagram Reels script prompt (beat map: Hook → Stakes → Build → Wait What → Payoff → Exit) | Structured script |
| `youtubeShorts.ts` | YouTube Shorts script prompt (Hook → Core → Payoff → CTA → Hashtags) | Structured script |

### Types Files
| File | Purpose |
|---|---|
| `server/src/types/index.ts` | Core server types |
| `server/src/types/instagram.ts` | `InstagramSignals` interface — reel potential, hook strength, saveability, saturation, best format, caption style, hook ideas, hashtag pack |

### Service Files
| File | Purpose |
|---|---|
| `computedSignals.ts` | Pure math engine: trend/competition/opportunity/audience scores from YouTube + Google Trends data |
| `googleTrends.ts` | SerpAPI integration: interest over time, related queries, trending now (India) |
| `clarityAssessor.ts` | Groq call to assess idea clarity + generate domain-focused clarifying questions |
| `fuzzyCacheLookup.ts` | Fuzzy cache matcher by niche + keyword overlap (≥50% + ≥2 matches required) |
| `aiEstimate.ts` | Groq-only fallback InsightReport when all external APIs fail |
| `hookFallback.ts` | Deterministic template-based hook generation when Groq is rate-limited |
| `instagramIntelligence.ts` | Instagram Reels intelligence engine: deterministic signal scoring (reel potential, hook strength, saveability, saturation) + LLM hook generation + format/caption/hashtag engines |
| `marketClassifier.ts` | Market type classifier: categorizes ideas as search_driven, feed_driven, hybrid, trend_driven, or authority_driven using 30+ niche maps + keyword patterns |
| `discoverySignals.ts` | Discovery demand scoring (0–100): measures feed distribution potential via niche base scores + content signal bonuses |
| `scoringWeights.ts` | Market-aware scoring weight engine: adjusts opportunity formula weights based on market type |

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
| `youtube_search` | YouTube Data API search results (per query + order) | 7 days |
| `hashtag_intelligence` | Per-platform hashtag strategy (YouTube + RapidAPI + Groq) | 7 days |
| `studio_hooks` | Hook variants for idea + profile | 7 days |
| `studio_script` | Script body for hook | 7 days |
| `insights` | Full InsightReport (exact idea+niche hash) | 7 days |
| `insights_normalized` | Full InsightReport (keyword-normalized intent match) | 7 days |
| `serpapi_google_trends` | SerpAPI Google Trends (interest timeline + related queries) | 7 days |
| `serpapi_trending_now_india` | SerpAPI Trending Now (India) | 24 hours |
| `google_trends` | RapidAPI Google Trends fallback | 2 days |
| `rapidapi_instagram_hashtags` | RapidAPI instagram-hashtags results | 7 days |
| `rapidapi_top_hashtags_global` | RapidAPI top-instagram-hashtag results | 2 days |

### Three-Layer Insight Cache
1. **Idea-level** — cached on `ideas` table (`insights` JSONB + `insights_cached_at` + `insights_idea_text`). Only serves if idea text matches exactly.
2. **Exact hash** — SHA-256 of `{ idea, niche }` in `api_cache`. No cross-contamination possible.
3. **Keyword-normalized** — strips stop words, sorts alphabetically, dedupes. "rich habits of Indians" and "money habits wealthy Indians" can share cache. Stored in `insights_normalized` namespace.

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
- Topic guardrails: regex patterns block harmful content categories (illegal business/scams, harmful health advice, sexual exploitation, hate/extremism, plagiarism spam). Returns 400 with "We can't help optimize harmful or deceptive ideas. Try a different angle."
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
| insights | 5 | Idea validations (YouTube + Google Trends + Groq) |
| amplify | 10 | Caption generations (RapidAPI + Groq) |
| studio | 10 | Hook/script generations (Groq) |

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
| Studio (Instagram Playbook hook) → Develop | `{ idea, ideaId, insights, selectedHook }` |
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
- Inline styles + CSS variables. Outfit font (sans) + JetBrains Mono (mono).
- Additional dependencies: framer-motion (animations), @phosphor-icons/react (icons), recharts (charts).
- Shared design system in `components/ui.tsx`: Badge, SectionLabel, ScoreBar, StatCell, formatViews, scoreColor, compColor, reachColor, diffColor, SIGNAL_COLORS, TIER_COLORS.
- Dark/light theme via `data-theme` attribute on `<html>`.
- Light theme: warm latte palette (#F4EEE6 base, #FAF7F2 cards, #EFE7DD subtle). Layered gradient background. Architectural grid overlay. Paper grain texture.
- Dark theme: warm espresso blacks (#0F0D0B base, #1A1714 cards).
- CSS variables for colors: `--bg`, `--bg-card`, `--bg-subtle`, `--bg-muted`, `--text`, `--text-2`, `--text-3`, `--text-4`, `--accent`, `--border`, `--error`, etc.
- Navbar uses `var(--accent)` for all active states — no hardcoded colors.
- Responsive breakpoints at 1100px (tablet collapse: dashboard to single column, stat strip to 3-col), 640px (mobile: stat strip to 2-col), and 680px (navbar).
- Animations: `fade-up`, `breathe`, `barFill`, `spin` keyframes. Framer-motion for staggered reveals and accordion transitions.

### Validation Report Components
| Component | Purpose |
|---|---|
| `VerdictCard` | Verdict label + reason + context badges + key insight (always visible) |
| `PlatformScorecard` | Platform tier labels (Excellent/Strong/Moderate/Low) with Phosphor icons |
| `MarketResearchPanel` | Tabbed panel: Angles / Untapped / Risks / Competitors / Action Plan (tabs only show when data exists) |
| `ResearchPanel` | Evidence: YouTube stats, top channels, title patterns, video tiles (computed signal cards moved to stat strip) |
| `SearchTrendsSection` | Google Trends: 12-month sparkline chart, interest stats, rising/top query chips |
| `ClarifierInline` | Inline clarifying questions with chip options + free text |
| `StagedLoader` | Sequential progress stages during validation (Phosphor icons) |
| `InstagramPlaybook` | Instagram Intelligence card: 4 signal scores, 3 copyable hooks, best format, caption style, hashtag pack |

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
- `InstagramSignals` — reel potential, hook strength, saveability, saturation scores + best format, caption style, hook ideas, hashtag pack (mirrored from server type)

---

## 11. External API Dependencies

| API | Purpose | Rate/Cost Sensitivity |
|---|---|---|
| Groq (Llama 3.3 70B) | All AI generation | Free tier: ~30 req/min, ~14,400 req/day |
| YouTube Data API v3 | Real video data for idea validation + hashtag extraction | Quota-limited (10,000 units/day default) |
| SerpAPI Google Trends | Interest over time (12-month, India), related queries (rising + top), trending now | 250 searches/month free tier, 7-day cache per keyword |
| RapidAPI instagram-hashtags | Topic-specific Instagram hashtag data with post counts | Pay-per-request (~30/month budget) |
| RapidAPI top-instagram-hashtag | Globally trending Instagram hashtags | Pay-per-request |
| RapidAPI Google Trends | Fallback for SerpAPI when unavailable | Shared RapidAPI key |
| YouTube Innertube API | YouTube video transcript extraction (unofficial) | No quota cost |

---

## 12. Environment Variables

```
GROQ_API_KEY          — Groq API key (required)
DATABASE_URL          — PostgreSQL connection string (required)
JWT_SECRET            — JWT signing secret (required in production)
YOUTUBE_API_KEY       — YouTube Data API v3 key
RAPIDAPI_KEY          — RapidAPI key (instagram-hashtags + top-instagram-hashtag + Google Trends fallback)
SERPAPI_KEY            — SerpAPI key (Google Trends: interest over time, related queries, trending now)
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
7. **Three-layer caching** — Idea-level → exact hash → keyword-normalized intent match. Prevents quota waste while avoiding cross-contamination.
8. **Prompt injection defense** — All user input scanned for common LLM jailbreak patterns + topic guardrails for harmful content.
9. **Startup validation** — Server validates required env vars before starting. Missing vars cause `process.exit(1)`.
10. **Computed signals over LLM scores** — Trend, competition, opportunity, and audience fit scores are computed from real API data (pure math). LLM only explains/summarizes — never generates numeric scores.
11. **SerpAPI + RapidAPI complementary** — SerpAPI for rich Google Trends data (timeline, related queries), RapidAPI as fallback. Both cached aggressively.
12. **Shared UI design system** — `ui.tsx` exports Badge, SectionLabel, ScoreBar, StatCell, color helpers. All report components import from single source of truth.
13. **Answer → Action → Evidence** — Validation report ordered by user priority: verdict first, actionable angles second, raw data proof third.
14. **Market-aware scoring** — Ideas are classified by market type (search-driven, feed-driven, hybrid, trend-driven, authority-driven) before scoring. Feed-driven niches weight discovery demand over search volume, preventing false negatives for strong creator categories like skincare, beauty, and fitness.

---

## 14. YouTube Transcript Service

The transcript service (`services/transcript.ts`) extracts captions from YouTube videos without using the official YouTube Data API quota:

1. Fetches the YouTube video page HTML to extract the `INNERTUBE_API_KEY`.
2. Calls the Innertube player API impersonating an Android client to get caption track URLs.
3. Prefers English manual captions → English auto-generated → first available language.
4. Fetches the caption XML and parses it via `xml2js` into plain text.
5. Supports both `youtube.com/watch?v=` and `youtu.be/` URL formats.

Exposed via `POST /api/transcript`.
