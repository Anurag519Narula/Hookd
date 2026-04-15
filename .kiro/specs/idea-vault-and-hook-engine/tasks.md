# Implementation Tasks: Idea Vault + Hook Engine

## Task List

- [x] 1. Backend Foundation — Database & Types
  - [x] 1.1 Add `DATABASE_URL` check and `process.exit(1)` to `server/src/index.ts` startup
  - [x] 1.2 Create `server/src/db/index.ts` with pg Pool singleton and `initDb()` using `CREATE TABLE IF NOT EXISTS ideas (...)`
  - [x] 1.3 Add `Idea`, `Hook`, and `CreatorSettings` TypeScript interfaces to `client/src/types/index.ts`
  - [x] 1.4 Add matching server-side types to `server/src/types/index.ts`
  - [x] 1.5 Call `initDb()` in `server/src/index.ts` on startup before mounting routes

- [x] 2. Backend — AI Prompts
  - [x] 2.1 Create `server/src/prompts/ideaTagging.ts` — Groq prompt + JSON response parser returning `{ tags, format_type, emotion_angle, potential_score }`
  - [x] 2.2 Create `server/src/prompts/hooks.ts` — Groq prompt + JSON array parser returning `Hook[]` with exactly 5 distinct triggers
  - [x] 2.3 Create `server/src/prompts/captionWithHook.ts` — Groq prompt for caption generation (hook prepended verbatim) and regeneration with feedback

- [x] 3. Backend — Ideas Route
  - [x] 3.1 Create `server/src/routes/ideas.ts` with `POST /api/ideas` — validate `raw_text`, insert with UUID + timestamp, respond immediately, fire-and-forget async tagging
  - [x] 3.2 Add `GET /api/ideas` with optional `?score=`, `?format=`, `?status=` query filters and `ORDER BY created_at DESC`
  - [x] 3.3 Add `GET /api/ideas/:id` returning single idea or 404
  - [x] 3.4 Add `PATCH /api/ideas/:id` building SET clause from present fields only; return updated idea or 404
  - [x] 3.5 Add `DELETE /api/ideas/:id` returning 204 or 404
  - [x] 3.6 Mount ideas router at `/api/ideas` in `server/src/index.ts`

- [x] 4. Backend — Hooks & Captions Routes
  - [x] 4.1 Create `server/src/routes/hooks.ts` with `POST /api/hooks` — validate `raw_idea`, call Groq hook prompt, return `Hook[]`
  - [x] 4.2 Create `server/src/routes/captions.ts` with `POST /api/captions` — validate `hook`, `raw_idea`, `platform`, call Groq caption prompt, return `{ content: string }`
  - [x] 4.3 Add `POST /api/captions/regenerate` — accept `{ original_caption, feedback, platform, niche, anchor_keywords, language }`, empty feedback triggers full regen, return `{ content: string }`
  - [x] 4.4 Mount hooks and captions routers in `server/src/index.ts`

- [x] 5. Frontend — Shared Hooks & Settings
  - [x] 5.1 Create `client/src/hooks/useSettings.ts` — read/write `localStorage` key `"repurpose-ai-settings"` with defaults `{ niche: "", sub_niche: "", language: "English", platform_priority: [...] }`; handle malformed JSON silently
  - [x] 5.2 Create `client/src/hooks/useVault.ts` — manage `ideas` state, expose `addIdea`, `updateIdea`, `removeIdea`; poll every 2s for ideas with `tags === null`, stop after 30s or when tags arrive
  - [x] 5.3 Create `client/src/hooks/useDevelop.ts` — manage hook and per-platform caption state; expose `generateHooks`, `selectHook`, `generateCaption`, `regenerateCaption`

- [x] 6. Frontend — API Client Functions
  - [x] 6.1 Create `client/src/api/ideas.ts` — typed wrappers for `POST`, `GET`, `GET /:id`, `PATCH`, `DELETE /api/ideas`
  - [x] 6.2 Create `client/src/api/hooks.ts` — typed wrapper for `POST /api/hooks`
  - [x] 6.3 Create `client/src/api/captions.ts` — typed wrappers for `POST /api/captions` and `POST /api/captions/regenerate`

- [x] 7. Frontend — Navbar Updates
  - [x] 7.1 Add "Vault" and "Develop" nav links to `client/src/components/Navbar.tsx`
  - [x] 7.2 Add hamburger menu toggle for mobile viewports in Navbar
  - [x] 7.3 Ensure logo click navigates to `/` and dark mode toggle remains in existing position

- [x] 8. Frontend — Settings Slide-Over Component
  - [x] 8.1 Create `client/src/components/SettingsSlideOver.tsx` with niche autocomplete, sub-niche input, language dropdown, and platform priority drag-to-reorder (HTML5 DnD, no library)
  - [x] 8.2 Wire `useSettings` to persist on close; restore on mount

- [x] 9. Frontend — Capture Components
  - [x] 9.1 Create `client/src/components/CaptureBar.tsx` — auto-expanding textarea (max 3 lines), mic button (Web Speech API with teal pulse), clipboard paste button, "Save idea" button; Enter submits, Shift+Enter newline, empty input no-ops; frosted glass style
  - [x] 9.2 Create `client/src/components/CaptureSlideOver.tsx` — fixed right overlay 400px wide, wraps `CaptureBar` with auto-focus, closes after successful submit

- [x] 10. Frontend — Idea Card Component
  - [x] 10.1 Create `client/src/components/IdeaCard.tsx` — display raw text, tag chips, potential score dot (gray/amber/coral) with hover tooltip, format type label; shimmer placeholders while `tags === null`
  - [x] 10.2 Add "Develop →" button navigating to `/develop/:ideaId` with idea in route state
  - [x] 10.3 Add "···" overflow menu with Mark as used (PATCH status), Edit (inline edit mode), Delete (fade animation + DELETE call)
  - [x] 10.4 Match border, hover lift, border-radius, and dark mode styles of existing PlatformCard

- [x] 11. Frontend — Vault Screen
  - [x] 11.1 Create `client/src/screens/VaultScreen.tsx` at route `/vault` — sticky CaptureBar, filter chips (All, High potential, Medium, Story, Talking head, Unused), sort control (Newest, Highest potential, Oldest)
  - [x] 11.2 Implement client-side filtering and sorting without extra API calls
  - [x] 11.3 Render 2-column desktop / 1-column mobile IdeaCard grid
  - [x] 11.4 Show 3 ghost cards at 40% opacity with placeholder text when vault is empty
  - [x] 11.5 Show full-page error state with retry button on vault load failure

- [x] 12. Frontend — Hook Card Component
  - [x] 12.1 Create `client/src/components/HookCard.tsx` — hook text (16px), trigger label (12px muted), "Use this hook →" button, "↻ Try another" ghost button
  - [x] 12.2 "↻ Try another" calls `POST /api/hooks` and replaces only that card's content with a new hook using an unused trigger

- [x] 13. Frontend — Develop Screen
  - [x] 13.1 Create `client/src/screens/DevelopScreen.tsx` at routes `/develop` and `/develop/:ideaId` — pre-load idea text from route state when present
  - [x] 13.2 Render inline-editable idea container, settings row with niche label + pencil icon opening SettingsSlideOver, full-width teal "Generate hooks" button
  - [x] 13.3 On hook generation: show 5 shimmer HookCards while loading, fade in real HookCards on response
  - [x] 13.4 On hook selection: apply teal left border to selected card, dim others to 50% opacity, slide in caption section
  - [x] 13.5 Call `POST /api/captions` for all 4 platforms via `Promise.all`; show shimmer Caption_Cards resolving individually
  - [x] 13.6 Render Caption_Cards using PlatformCard style — platform label, format, character count, 3 editable Anchor_Keyword chips, Copy button, Regenerate button with "What to change?" input
  - [x] 13.7 Anchor keyword edit (Enter/Tab) triggers `POST /api/captions/regenerate` for that platform only
  - [x] 13.8 Regenerate submit calls `POST /api/captions/regenerate`; empty feedback triggers full regen
  - [x] 13.9 Add "Save to Vault" ghost button — PATCH for vault ideas, POST then PATCH for fresh ideas; change label to "Saved ✓" on success

- [x] 14. Frontend — Results Screen Integration
  - [x] 14.1 Add slim "Got a new idea from this content?" banner above platform cards in `client/src/screens/ResultsScreen.tsx`
  - [x] 14.2 "Capture to Vault →" CTA opens `CaptureSlideOver` with auto-focused textarea
  - [x] 14.3 On successful submit: close panel, dismiss banner for session via `sessionStorage` flag; banner hidden on re-render if flag present

- [x] 15. Frontend — Routing
  - [x] 15.1 Add `/vault` and `/develop` and `/develop/:ideaId` routes to `client/src/App.tsx`

- [x] 16. Backend Property-Based Tests
  - [x] 16.1 Install `fast-check` in `server` package
  - [x] 16.2 Create `server/src/db/index.test.ts` — P1 (JSONB round-trip, 100 iterations) and P16 (initDb idempotent)
  - [x] 16.3 Create `server/src/routes/ideas.test.ts` — P2 (new idea invariants), P3 (async tagging non-blocking), P4 (sort descending), P5 (filter correctness), P6 (PATCH partial update), P17 (NULL fields return null); plus unit tests for 400/404 error cases
  - [x] 16.4 Create `server/src/routes/hooks.test.ts` — P7 (hook array invariants: exactly 5, distinct triggers); plus unit test for 400 on missing `raw_idea`
  - [x] 16.5 Create `server/src/routes/captions.test.ts` — P8 (caption starts with hook verbatim), P9 (anchor keywords appear in caption); plus unit tests for 400 on missing fields
  - [x] 16.6 Create `server/src/prompts/ideaTagging.test.ts` — P14 (AI output schema validity for tagging and hook responses)

- [x] 17. Frontend Property-Based Tests
  - [x] 17.1 Install `fast-check` in `client` package
  - [x] 17.2 Create `client/src/components/CaptureBar.test.tsx` — P10 (Enter submits, Shift+Enter newline), P11 (empty/whitespace rejection)
  - [x] 17.3 Create `client/src/hooks/useSettings.test.ts` — P12 (settings localStorage round-trip)
  - [x] 17.4 Create `client/src/hooks/useDevelop.test.ts` — P13 (settings values included in hook and caption requests)
  - [x] 17.5 Create `client/src/screens/ResultsScreen.test.tsx` — P15 (banner sessionStorage dismissal persists for session only); plus unit test for banner render and CaptureSlideOver open
