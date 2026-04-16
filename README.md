# Hookd — Creator OS

AI-powered content creation platform for short-form creators. Three main pillars: **Amplify** (conversational caption generation), **Script Studio** (idea validation + hook generation), **Idea Vault** (idea capture and management).

---

## What it does

| Tool | What it does |
|---|---|
| **Amplify** | Chat interface for caption generation. Multi-turn sessions, platform-native captions for Instagram, LinkedIn, Reels, and YouTube Shorts, real-time hashtag intelligence (YouTube + RapidAPI). Conversations persisted server-side. |
| **Script Studio** | Validates your idea against real YouTube data before you film. Returns an opportunity score, trend direction, competitor insights, content blueprint, and 3 hook variants each built on a different psychological trigger. Hook-first flow — pick a hook, then generate the full script body. |
| **Idea Vault** | Capture raw ideas. AI auto-tags, scores potential, and flags whether it's worth developing. Filter, sort, and develop ideas later. |
| **Settings** | Creator profile — niche, sub-niche, language, platform priority. Stored server-side, used to personalise every Groq prompt. |

**Onboarding:** New users complete a 4-step wizard (name → niche → sub-niche → platforms) before accessing Amplify and Studio.

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
| `/` | HomeScreen | ✓ | Landing page with trending hashtags widget |
| `/onboarding` | OnboardingScreen | ✓ | 4-step wizard; redirects away if already complete |
| `/amplify` | AmplifyScreen | ✓ + onboarding | Conversational caption generation |
| `/studio` | StudioScreen | ✓ + onboarding | Idea validation + hook + script generation |
| `/vault` | VaultScreen | ✓ | Idea capture and management |
| `/settings` | SettingsScreen | ✓ | Creator profile |
| `/develop/:ideaId` | DevelopScreen | ✓ | Legacy hook engine (kept for vault ideas) |
| `/insights/:ideaId` | InsightScreen | ✓ | Legacy insight view |

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

POST   /api/hooks
POST   /api/captions
POST   /api/captions/regenerate

POST   /api/generate
POST   /api/regenerate
GET    /api/transcript

GET    /api/insights

GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations
PATCH  /api/conversations/:id
DELETE /api/conversations/:id

POST   /api/amplify

POST   /api/studio/hooks
POST   /api/studio/script
POST   /api/studio/generate
POST   /api/studio/regenerate

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
| `studio_generate` | Legacy studio generation |
| `studio_regenerate` | Legacy studio regeneration |
| `insights` | Full idea validation report |
| `rapidapi_instagram_hashtags` | RapidAPI instagram-hashtags results |
| `rapidapi_top_hashtags_global` | RapidAPI top-instagram-hashtag results |

Expired rows are purged on server startup and every 6 hours via `setInterval`.

---

## AI prompt architecture

| File | Purpose | Output type |
|---|---|---|
| `amplify.ts` | Platform-explicit caption generation with hashtag intelligence | `CaptionResult` |
| `studio.ts` | Hook-only generation + script-from-hook generation | `HookVariant[]` / `ScriptBody` |
| `insightSynthesis.ts` | Full idea validation report with YouTube data | `InsightReport` (13 sections) |
| `hooks.ts` | Legacy hook generation for DevelopScreen | `Hook[]` |
| `captionWithHook.ts` | Legacy caption generation | `string` |
| `ideaTagging.ts` | Auto-tags ideas on save | `{ tags, format_type, emotion_angle, potential_score }` |

All prompts receive the creator profile (niche, sub-niche, language, platform priority) when available.

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
