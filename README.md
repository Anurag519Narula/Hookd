# Hookd

AI-powered content creation tool for creators. Takes a raw idea and turns it into platform-native posts across Instagram, LinkedIn, Reels, and YouTube Shorts — in under 30 seconds.

---

## What it does

Four tools, one workflow:

| Tool | What it does |
|---|---|
| **Content Amplifier** (`/amplify`) | Paste a YouTube URL or long-form text → get 4 platform-ready posts instantly |
| **Hook Engine** (`/develop`) | Type a rough idea → get 5 scroll-stopping hooks (each on a different psychological trigger) → pick one → get captions for all 4 platforms |
| **Idea Vault** (`/vault`) | Capture raw ideas → AI auto-tags, scores potential, and suggests format type → filter/sort/develop later |
| **Insight Engine** (`/insights/:ideaId`) | YouTube API + Groq analysis → trend direction, competition level, untapped angles, hook suggestions |

---

## Tech stack

```
client/   React 18 + Vite + TypeScript, React Router v7, inline styles + CSS variables
server/   Node.js + Express + TypeScript, ts-node + nodemon
database  PostgreSQL via Supabase (connection pooler)
AI        Groq API — llama-3.3-70b-versatile
auth      JWT (bcryptjs + jsonwebtoken)
```

---

## Project structure

```
/
├── client/                   # React frontend
│   └── src/
│       ├── screens/          # One file per route/page
│       ├── components/       # Shared UI components
│       ├── hooks/            # useVault, useDevelop, useGenerate, useSettings
│       ├── api/              # Typed fetch wrappers for every endpoint
│       ├── context/          # AuthContext (JWT storage + user state)
│       └── types/            # Shared TypeScript types
│
└── server/                   # Express backend
    └── src/
        ├── routes/           # One file per resource (ideas, hooks, captions, etc.)
        ├── prompts/          # Groq prompt builders (ideaTagging, hooks, captionWithHook, insightSynthesis)
        ├── services/         # generator.ts, transcript.ts, insights.ts
        ├── middleware/       # requireAuth (JWT verification)
        └── db/               # pg Pool + initDb() (CREATE TABLE IF NOT EXISTS migrations)
```

---

## Routes

| Path | Screen | Auth |
|---|---|---|
| `/` | HomeScreen — editorial landing | ✓ |
| `/amplify` | RepurposeScreen — paste text or YouTube URL | ✓ |
| `/generating` | LoadingScreen — live progress while generating | ✓ |
| `/results` | ResultsScreen — 4 platform cards with copy/regenerate | ✓ |
| `/vault` | VaultScreen — idea capture, AI tagging, filter/sort | ✓ |
| `/develop` | DevelopScreen — idea → hooks → captions | ✓ |
| `/develop/:ideaId` | DevelopScreen — loaded from vault idea | ✓ |
| `/insights/:ideaId` | InsightScreen — YouTube + Groq trend analysis | ✓ |

All routes are protected. Unauthenticated users see `AuthScreen` (login/signup).

---

## API endpoints

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/ideas
POST   /api/ideas
GET    /api/ideas/:id
PATCH  /api/ideas/:id
DELETE /api/ideas/:id

POST   /api/hooks
POST   /api/captions
POST   /api/captions/regenerate

POST   /api/generate          # Amplifier — all 4 platforms at once
POST   /api/regenerate        # Regenerate single platform card

GET    /api/transcript        # Fetch + parse YouTube captions via Innertube API
GET    /api/insights          # YouTube API + Groq synthesis, cached 24h in ideas.insights
```

---

## Database schema (Supabase / PostgreSQL)

```sql
users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  created_at BIGINT
)

ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT → users(id),
  raw_text TEXT,
  created_at BIGINT,
  tags JSONB,                  -- string[] — AI-generated, null until tagged
  format_type TEXT,            -- "story" | "talking head" | "listicle" | etc.
  emotion_angle TEXT,          -- "frustration" | "inspiration" | etc.
  potential_score TEXT,        -- "low" | "medium" | "high"
  hooks JSONB,                 -- Hook[] { hook_text, trigger }
  captions JSONB,              -- Record<platform, string>
  selected_hook TEXT,
  status TEXT,                 -- "raw" | "tagged" | "developed" | "used"
  insights JSONB,              -- cached InsightReport payload
  insights_cached_at BIGINT    -- unix ms, TTL 24h
)
```

---

## AI prompt architecture

| Prompt file | Purpose | Output |
|---|---|---|
| `ideaTagging.ts` | Tags a raw idea on save | `{ tags, format_type, emotion_angle, potential_score }` |
| `hooks.ts` | Generates 5 hooks with distinct psychological triggers | `Hook[]` |
| `captionWithHook.ts` | Generates or regenerates a platform caption anchored to a hook | `string` |
| `insightSynthesis.ts` | Synthesises YouTube + Trends data into a structured report | `InsightReport` |
| `base.ts` + platform files | Amplifier prompts — one per platform | `string` |

All prompts target Indian creator ecosystem by default. Hooks use 6 defined triggers: Curiosity Gap, Identity Threat, Controversy, Surprising Stat, Personal Story Angle, Pattern Interrupt.

---

## Key frontend patterns

- **Polling** — `useVault` polls `GET /api/ideas/:id` every 2s (max 30s) for ideas where `tags === null`, waiting for async AI tagging to complete
- **Optimistic UI** — ideas appear instantly on capture; shimmer chips show while tagging runs in background
- **Context** — `GenerationContext` shares live generation state across `/generating` and `/results` routes
- **Settings** — `useSettings` persists niche, sub-niche, language, platform priority to `localStorage`; used to personalise every Groq prompt
- **Theme** — dark/light toggle via `data-theme` attribute on `<html>`, persisted to `localStorage`

---

## Design system

- Dark-first. Background `#080808` in dark mode.
- Accent: teal `#14b8a6` (`--accent`)
- CSS variables for all colours, radii, shadows, transitions
- Font: Inter, tight letter-spacing (`-0.03em` to `-0.05em`) on headings
- Cosmos.so-inspired editorial layout — full-width sections, thin dividers, no floating cards on homepage
- Shimmer skeleton loading via `.shimmer-line` CSS class

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (PostgreSQL)
- Groq API key
- YouTube Data API v3 key

### Server

```bash
cd server
npm install
```

Create `server/.env`:
```env
GROQ_API_KEY=...
DATABASE_URL=postgresql://...  # Supabase connection pooler URL
JWT_SECRET=...
YOUTUBE_API_KEY=...
PORT=3001
```

```bash
npm run dev   # nodemon + ts-node, auto-restarts on changes
```

The server runs `initDb()` on startup — creates tables if they don't exist, runs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations automatically.

### Client

```bash
cd client
npm install
npm run dev   # Vite dev server on http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:3001` in dev.

### Tests

```bash
cd server && npm test
cd client && npm test
```

---

## Known limitations

- YouTube transcript fetch requires the video to have captions enabled
- Google Trends is disabled server-side (blocks server requests) — `fetchGoogleTrends` always returns `null`
- Insights are cached per-idea for 24h in the `ideas.insights` JSONB column
- One orphaned idea with `user_id = NULL` may exist from before the migration — safe to delete:
  ```sql
  DELETE FROM public.ideas WHERE user_id IS NULL;
  ```
