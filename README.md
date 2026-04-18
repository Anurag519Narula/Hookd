# Hookd — Creator OS

AI-powered content creation platform for short-form creators. Five tools, one workflow: **Vault** (idea capture) → **Studio** (idea validation) → **Develop** (script planning) → **Amplify** (caption generation) → post.

---

## What it does

| Tool | What it does |
|---|---|
| **Vault** | Capture raw ideas instantly — type, speak, or paste. AI auto-tags, scores potential (low/medium/high), and flags whether it's worth developing. Filter, sort, and manage your idea backlog. Ideas captured from Studio and Develop are auto-saved here. |
| **Studio** | Validates your idea against real YouTube data before you film. Returns a comprehensive report: opportunity score, trend direction, audience fit, competitor insights, top angles, untapped angles, platform analysis, risks, recommendations, and a content blueprint. Leads directly into Develop. |
| **Develop** | Script planning page. Shows the content blueprint from Studio at the top. Generates 3 hook variants each built on a different psychological trigger (Curiosity Gap, Identity Threat, Surprising Stat, etc.). Pick a hook — a full script with beats and timestamps is built around it. Leads directly into Amplify. |
| **Amplify** | Conversational caption generation. Multi-turn sessions, individual platform-native captions for each selected platform (Instagram, LinkedIn, Reels, YouTube Shorts) with real-time hashtag intelligence. When navigating from Develop, the idea is auto-sent. Conversations persisted server-side. |
| **Settings** | Creator profile — niche, sub-niche, language, platform priority. Stored server-side, used to personalise every Groq prompt. |

**Onboarding:** New users complete a 4-step wizard (name → niche → sub-niche → platforms) before accessing the app.

---

## The workflow

```
Vault  →  Studio  →  Develop  →  Amplify  →  Post
capture   validate   script      captions
```

1. **Capture** — Drop any idea into the Vault. AI scores and tags it instantly.
2. **Validate** — Click "Validate" on any idea card → opens Studio with idea pre-filled. Or go to Studio directly and type your idea.
3. **Plan the script** — Click "Plan Your Script" → navigates to Develop with the content blueprint and insights passed via navigation state.
4. **Generate captions** — Click "Generate Captions" → navigates to Amplify, idea is auto-sent, captions generate immediately.
5. **Post** — Copy individual platform captions and post.

---

## Tech stack

```
client/    React 18 + Vite + TypeScript
           React Router v7
           Inline styles + CSS variables (no CSS framework)

server/    Node.js + Express + TypeScript
           ts-node + nodemon

database   PostgreSQL via Supabase (connection pooler)

AI         Groq API — llama-3.3-70b-versatile

auth       JWT (bcryptjs + jsonwebtoken)

APIs       YouTube Data API v3
           RapidAPI — instagram-hashtags, top-instagram-hashtag
```

---

## Project structure

```
hookd/
├── client/
│   ├── src/
│   │   ├── api/            # Typed fetch wrappers for every server endpoint
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # Custom React hooks (useAmplify, useStudio, useVault, …)
│   │   ├── screens/        # One file per route
│   │   └── types/          # Shared TypeScript types
│   └── vite.config.ts
│
└── server/
    └── src/
        ├── db/             # Pool + initDb (schema migrations)
        ├── middleware/     # requireAuth JWT middleware
        ├── prompts/        # Groq prompt builders (one file per feature)
        ├── routes/         # Express routers (one file per resource)
        ├── services/       # cache.ts, dbCache.ts, generator.ts, insights.ts, transcript.ts
        └── types/          # Shared server-side types
```

---

## Routes

| Path | Screen | Auth required | Notes |
|---|---|---|---|
| `/` | HomeScreen | ✓ | Landing/marketing page |
| `/onboarding` | OnboardingScreen | ✓ | 4-step wizard; redirects away if already complete |
| `/studio` | StudioScreen | ✓ + onboarding | Idea validation — generates full InsightReport |
| `/develop` | DevelopScreen | ✓ + onboarding | Hook generation + script planning. Receives idea + insights via navigation state from Studio |
| `/amplify` | AmplifyScreen | ✓ + onboarding | Conversational caption generation. Receives idea via navigation state from Develop |
| `/vault` | VaultScreen | ✓ | Idea capture and management |
| `/insights/:ideaId` | InsightScreen | ✓ | Read-only cached insight report for a saved idea |
| `/settings` | SettingsScreen | ✓ | Creator profile |

---

## Navigation state (no URL params)

Data is passed between pages via React Router navigation state to keep URLs clean:

| From | To | State passed |
|---|---|---|
| Studio | Develop | `{ idea, ideaId, insights: InsightReport }` |
| Develop | Amplify | `{ idea, ideaId }` |
| Vault (idea card) | Studio | `?ideaId=` query param (pre-fills idea from DB) |

---

## API endpoints

```
POST   /api/auth/signup
POST   /api/auth/login

GET    /api/users/me
PATCH  /api/users/me
DELETE /api/users/me

GET    /api/ideas
POST   /api/ideas
GET    /api/ideas/:id
PATCH  /api/ideas/:id
DELETE /api/ideas/:id

GET    /api/insights

POST   /api/studio/hooks
POST   /api/studio/script
POST   /api/studio/regenerate

GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations
PATCH  /api/conversations/:id
DELETE /api/conversations/:id

POST   /api/amplify

GET    /api/trending
```

`/api/trending` is public (no auth). All other routes require a valid JWT in the `Authorization: Bearer <token>` header.

---

## Database schema

```sql
users (
  id                  TEXT PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  name                TEXT NOT NULL,
  created_at          BIGINT NOT NULL,
  niche               TEXT,
  sub_niche           TEXT,
  language            TEXT DEFAULT 'English',
  platform_priority   JSONB DEFAULT '[]',
  onboarding_complete BOOLEAN DEFAULT FALSE
)

ideas (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT REFERENCES users(id) ON DELETE CASCADE,
  raw_text            TEXT NOT NULL,
  created_at          BIGINT NOT NULL,
  tags                JSONB,
  format_type         TEXT,
  emotion_angle       TEXT,
  potential_score     TEXT,
  hooks               JSONB,
  captions            JSONB,
  selected_hook       TEXT,
  status              TEXT NOT NULL DEFAULT 'raw',
  insights            JSONB,
  insights_cached_at  BIGINT
)

amplify_conversations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  messages    JSONB NOT NULL DEFAULT '[]',
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL
)

api_cache (
  cache_key   TEXT PRIMARY KEY,   -- SHA-256 hash of request params
  namespace   TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL     -- Unix ms; 7-day TTL by default
)
```

Schema is managed via `initDb()` in `server/src/db/index.ts` using `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations that run on every server start.

---

## Caching

All expensive API calls are cached in the `api_cache` table with a 7-day TTL. Cache keys are SHA-256 hashes of the request parameters.

| Namespace | What's cached |
|---|---|
| `youtube_search` | YouTube Data API search results |
| `hashtag_intelligence` | Per-platform hashtag strategy (YouTube + RapidAPI + Groq synthesis) |
| `studio_hooks` | Hook variants for a given idea + profile |
| `studio_script` | Script body for a given hook |
| `insights` | Full idea validation report (InsightReport) |
| `rapidapi_instagram_hashtags` | RapidAPI instagram-hashtags results |
| `rapidapi_top_hashtags_global` | RapidAPI top-instagram-hashtag results |

Expired rows are purged on server startup and every 6 hours via `setInterval`.

---

## AI prompt architecture

| File | Purpose | Output type |
|---|---|---|
| `amplify.ts` | Platform-explicit caption generation with per-platform hashtag intelligence | `CaptionResult` — individual captions per platform |
| `studio.ts` | Hook variant generation + script-from-hook generation | `HookVariant[]` / `ScriptBody` |
| `insightSynthesis.ts` | Full idea validation report with real YouTube data | `InsightReport` (13 sections including contentBlueprint) |
| `ideaTagging.ts` | Auto-tags ideas on save | `{ tags, format_type, emotion_angle, potential_score }` |

All prompts receive the creator profile (niche, sub-niche, language, platform priority) when available.

### InsightReport sections

The `InsightReport` returned by `/api/insights` contains:

1. Trend direction + score + velocity
2. Competition level + saturation warning
3. Audience fit (score, primary audience, intent, best posting times/days)
4. Summary + opportunity score
5. Top angles (with reach and difficulty ratings)
6. Untapped angles
7. Platform analysis (Instagram Reels + YouTube Shorts)
8. YouTube data (real view counts, top channels, common title patterns)
9. **Content blueprint** (opening hook, core message, key points with timestamps, CTA, visual/audio notes, duration target) — passed to Develop page
10. Competitor insights
11. Risks
12. Recommendations
13. Key insight + verdict label + verdict reason

### Caption length constraints

| Setting | Output |
|---|---|
| Short | 1-2 lines |
| Medium | 4-5 lines |
| Long | 2-3 paragraphs |

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Groq API key
- YouTube Data API v3 key
- RapidAPI key with access to `instagram-hashtags` and `top-instagram-hashtag`

### Environment variables

Create `server/.env`:

```env
GROQ_API_KEY=...
DATABASE_URL=postgresql://...
JWT_SECRET=...
YOUTUBE_API_KEY=...
RAPIDAPI_KEY=...
PORT=3001
```

### Install and run

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Start server (port 3001)
cd server && npm run dev

# Start client (port 5173)
cd client && npm run dev
```

The server runs `initDb()` on startup, creating all tables and running any pending column migrations automatically.

### Run tests

```bash
# Client
cd client && npm test

# Server
cd server && npm test
```
