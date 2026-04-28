# Validation Report — Studio Page Documentation

> This document covers everything that happens after the user clicks "Validate Idea" on the Studio page (`/studio`). It describes the full flow, backend pipeline, UI component structure, design system, and the reasoning behind every layout decision.

---

## Flow Overview

```
User clicks "Validate Idea"
        │
        ▼
┌─────────────────────┐
│  1. Save to Vault    │  fire-and-forget, async
│     (POST /api/ideas)│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. Clarity Check    │  POST /api/studio/clarify
│     (Groq call)      │
└─────────┬───────────┘
          │
    ┌─────┴──────┐
    │            │
  Clear        Vague
    │            │
    │     ┌──────▼──────────┐
    │     │ Show 1-3 inline │
    │     │ questions with   │
    │     │ chip options     │
    │     └──────┬──────────┘
    │            │ user answers
    │            │
    │     Build expanded query
    │            │
    └─────┬──────┘
          │
          ▼
┌─────────────────────┐
│  3. Staged Loader    │  "Understanding your idea…"
│     (frontend only)  │  "Checking real trends…"
│                      │  "Generating strategy…"
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  4. GET /api/insights?idea=&niche=&ideaId=  │
│                                              │
│  Cache check (3 layers):                     │
│    → idea-level (ideas table)                │
│    → exact hash (api_cache)                  │
│    → keyword-normalized (intent match)       │
│                                              │
│  If all miss:                                │
│    → YouTube Data API (relevance + date)     │
│    → SerpAPI Google Trends (India)           │
│    → Computed Signals Engine (pure math)     │
│    → Groq synthesis (LLM explains signals)   │
│    → Force-override LLM scores with computed │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         Render validation report
                  │
                  ▼
     "Plan Your Script" button appears
```

---

## Backend Pipeline

### Step 1: Idea Persistence
When the user clicks Validate, the idea is saved to the Vault via `POST /api/ideas` as a fire-and-forget call. This ensures no idea is ever lost, even if the user abandons the validation flow. The idea gets async AI tagging (tags, format, emotion, potential score) independently.

### Step 2: Clarity Assessment
`POST /api/studio/clarify` sends the raw idea text to Groq (Llama 3.3 70B, temperature 0.4, max 512 tokens). The LLM determines if the idea is specific enough for research.

- If clear: skip to validation.
- If vague: return 1–3 domain-focused questions with 4–6 suggested options each.
- On Groq failure: fail open (treat as clear, proceed to validation).

Questions are about the topic itself, never about content strategy. Example: "What part of cricket?" not "What's your target audience?"

### Step 3: Data Fetching
The insights route (`GET /api/insights`) runs this pipeline:

**Cache layers (checked in order, all free — no quota burned):**
1. Idea-level: `ideas` table, matches on `ideaId` + exact idea text.
2. Exact hash: `api_cache` table, SHA-256 of `{ idea, niche }`.
3. Keyword-normalized: strips stop words, sorts alphabetically, dedupes. "rich habits of Indians" and "money habits wealthy Indians" can share cache.

**If all caches miss:**

| Source | What it fetches | Quota cost |
|---|---|---|
| YouTube Data API v3 | 2 searches: `order=relevance` (8 results) + `order=date` (5 results). Deduped to ~15 videos. | ~3 quota units |
| SerpAPI Google Trends | Interest Over Time (12-month, India) + Related Queries (rising + top). Smart keyword extraction from idea text. | 2 SerpAPI credits |
| RapidAPI Google Trends | Fallback if SerpAPI unavailable. | 1 RapidAPI credit |

**Keyword extraction for Google Trends:**
The idea text is processed to extract a short, searchable keyword:
- Takes first sentence, splits on colons/dashes.
- Strips instruction phrases ("help me create", "format for", "tone should be").
- Tries multiple candidates: specific phrase → broader with niche → first 2 words → niche alone.
- Each candidate is tried with SerpAPI until one returns data.

### Step 4: Computed Signals
`computedSignals.ts` runs pure math on the YouTube + Google Trends data. No LLM involved.

| Signal | Formula |
|---|---|
| Trend direction | Recent (6mo) vs older video view performance ratio. >1.3x = rising, <0.5x = declining, else stable. Boosted by Google Trends interest. |
| Trend velocity | Median views/day across all videos. ≥5000 = high, ≥500 = medium, else low. |
| Trend score (0–100) | 40% recency strength + 40% median views/day (log scale) + 20% upload frequency. Boosted 30% by Google Trends if available. |
| Competition level | Video count × channel diversity × dominance ratio. ≥8 videos + ≥5 channels + no dominant creator = high. |
| Opportunity (0–100) | 30% trend + 25% inverse competition + 25% view strength (log scale) + 20% momentum. Boosted by Google Trends. |
| Audience fit (0–100) | 45% demand signal (log avg views) + 30% channel diversity + 25% view consistency (avg/top ratio). |

### Step 5: LLM Synthesis
Groq receives:
- Real YouTube data (titles, view counts, channels, publish dates).
- Google Trends data (interest, rising queries, top queries).
- Computed signals as facts ("Trend Direction: rising — Recent videos average 120K views vs 45K for older content").
- Instructions to explain the signals, generate angles/blueprint/risks, but NOT override the computed scores.

After the LLM responds, the code force-overwrites: `trendDirection`, `trendScore`, `trendVelocity`, `competitionLevel`, `opportunityScore`, `audienceFit.score`. The LLM's numbers are discarded. Only its prose and creative output (angles, blueprint, risks, recommendations) are kept.

### Step 6: Caching
The response is stored in three places:
1. `api_cache` with exact hash key.
2. `api_cache` with keyword-normalized key (intent matching).
3. `ideas` table with `insights_idea_text` for Vault → View Report flow.

---

## UI Component Structure

After the staged loader completes, the validation report renders in this exact order:

### 1. Based On Bar
**Component:** Inline in `StudioScreen.tsx`
**Purpose:** Establish credibility before the user reads anything.

A single-row card showing which data sources powered this report:
- ✅ YouTube (green badge, shown when `sources.youtubeCount > 0`)
- ✅ Google Trends (green badge, shown when `signals.googleTrends.available`)
- 🤖 AI Interpretation (grey/muted badge, always shown)

**Design:** `var(--bg-card)` background, `1px solid var(--border)`, borderRadius 8, padding 14px 20px. Badges use the shared `Badge` pattern from `ui.tsx` (borderRadius 4, fontSize 13, fontWeight 600).

### 2. Verdict Card
**Component:** `VerdictCard.tsx`
**Purpose:** Answer the user's question immediately — "Should I make this video?"

**Structure:**
- **Verdict header:** Colored background based on verdict type (green for Strong opportunity, teal for Good, amber for Proceed with caution, red for Avoid). Glowing 8px dot + verdict label at 17px/700 weight. Saturated badge if applicable.
- **Verdict reason:** 15px body text explaining why this verdict was given. References specific data points.
- **Context badges:** Audience intent (education/entertainment/etc), competition level (color-coded), best posting days, best posting times. All using the shared `Badge` component.
- **Key Insight:** Separated by a 3px teal left border. 12px uppercase label + 15px/500 weight insight text. This is the single most important thing the creator needs to know.

**Design:** borderRadius 8, `var(--bg-card)` base. Verdict section uses verdict-specific background color at 8% opacity. No numeric scores shown here — only labels and prose.

### 3. Platform Scorecard
**Component:** `PlatformScorecard.tsx`
**Purpose:** Tell the user exactly where to post.

**Structure:**
- Header: "PLATFORM FIT" with divider line.
- Per-platform row: platform name (130px fixed width) → tier badge (Excellent/Strong/Moderate/Low) → one-line reason.

**Tier colors:**
- Excellent: green (#34d399)
- Strong: teal (#14b8a6)
- Moderate: amber (#f59e0b)
- Low: red (#f87171)

**Design:** borderRadius 8, header padding 14px 20px with bottom border, content padding 0 20px 14px. Tier badges use borderRadius 4 (rectangular, not pills). Only Instagram Reels and YouTube Shorts are shown (TikTok excluded — banned in India).

### 4. Strategy & Angles (Tabbed Panel)
**Component:** `MarketResearchPanel.tsx`
**Purpose:** Actionable content strategy — what specifically to make.

**Toggle header:** Teal icon (Phosphor Pulse) + "Strategy & Angles" title + chevron. Shows "Analyzing" badge during loading.

**Tab bar:** Horizontal tabs — Angles / Untapped / Risks / Competitors / Action Plan. Only tabs with data are shown. No scroll overflow. Active tab has accent underline.

**Tab content animates** with framer-motion fade transitions on tab switch.

**Sections inside (by tab):**

#### 4a. Top Angles
Numbered cards (01, 02, 03...). First card has teal left border accent. Each shows:
- Angle name (15px/600)
- Why it works (14px body text)
- Reach badge (high/medium/low, color-coded)
- Difficulty badge (easy/medium/hard, color-coded)

Grid layout: 28px number column + flexible content + auto-width badges.

#### 4b. Untapped Angles
Cards with green tint. Each shows:
- "GAP #1" label (12px uppercase, green)
- Angle name
- Opportunity description
- "Why nobody is doing this" (separated by green border-top)

Responsive grid: `repeat(auto-fit, minmax(280px, 1fr))`.

#### 4c. Action Plan
Numbered steps with teal accent. Each step is a row with:
- Number badge (9px, teal background, 16x16px square)
- Recommendation text (14px)

Hover effect: border shifts to stronger teal.

#### 4d. Risks to Watch
Red-tinted cards. Each shows:
- "!" icon (red, 12px bold)
- Risk description (14px)

#### 4e. Competitor Insights
Two-column layout per insight:
- Left: "WHAT THEY DO" card (grey background)
- Center: → arrow in teal circle
- Right: "YOUR GAP" card (teal tint)

Grid: `1fr 32px 1fr`.

### 5. Evidence & Data
**Component:** `ResearchPanel.tsx`
**Purpose:** The proof — raw data the report is based on.

**Header:** "EVIDENCE & DATA" with divider line.

**Sections inside (in order):**

#### 5a. Computed Signal Cards
Grid of signal cells (auto-fit, minmax 130px). Each cell:
- Label (12px uppercase)
- Value (15px/700, color-coded, capitalized)

Signals shown: Trend, Momentum, Competition, Recent uploads (X in 6mo), Search interest (X/100, only if Google Trends available).

#### 5b. YouTube Stats Grid
4-column grid with 1px gap borders:
- Top Video (views, teal accent background)
- Avg Top 5 (views)
- Analyzed (video count)
- Range (min–max views)

Each cell: 14px 16px padding, 12px uppercase label, 20px/800 value.

#### 5c. Top Channels + Title Patterns
Two-column grid:
- Left: numbered channel list (top 4), #1 has teal accent
- Right: title patterns with teal left border quotes (top 3)

Both cards: `var(--bg-subtle)` background, borderRadius 8, padding 14px 16px.

#### 5d. Top Performing Videos (Tiles)
Responsive tile grid: `repeat(auto-fill, minmax(220px, 1fr))`.

Each tile is a clickable `<a>` linking to `youtube.com/watch?v={videoId}`:
- View count (20px/800, teal for #1)
- "views" label
- Video title (14px, 2-line clamp)
- Channel name + "Watch →" link (separated by border-top)

First tile has teal accent background + border. All tiles have hover effect (border + background shift to teal).

### 6. Google Search Trends
**Component:** `SearchTrendsSection.tsx`
**Purpose:** Real Google Trends data for India.

**Header:** "GOOGLE SEARCH TRENDS — INDIA" + "✅ Real data" badge.

**Sections:**

#### 6a. Interest Stats Grid
Dynamic column count based on available data. Each cell:
- Label (12px uppercase)
- Value (20px/800) + suffix (13px)
- Current interest gets teal accent background.

Stats: Current /100, 12-month avg /100, Peak /100, vs Peak %.

#### 6b. Sparkline Chart
Recharts `AreaChart` with teal gradient fill. 120px height, borderRadius 8.
- X-axis: date labels (10px, preserve start/end)
- Y-axis: hidden, domain 0–100
- Tooltip: `var(--bg-card)` background, borderRadius 8
- Area: monotone curve, 2px stroke, gradient fill

#### 6c. Rising Searches
Green chips (borderRadius 4, 13px/600). Label: "🔥 RISING SEARCHES".

#### 6d. Top Related Searches
Grey chips (borderRadius 4, 13px/500, `var(--bg-subtle)` background). Label: "TOP RELATED SEARCHES".

### 7. Plan Your Script CTA
**Component:** Inline in `StudioScreen.tsx`
**Purpose:** Clear next step after validation.

Only appears when validation is complete. Shows:
- "Idea validated" title + "Plan your script with hooks and beats" subtitle
- Teal "Plan Your Script →" button

Navigates to `/develop` with `{ idea, ideaId, insights }` in React Router state.

---

## Design System

All validation report components share a unified design language defined in `components/ui.tsx`:

### Typography
- Font: Outfit (sans-serif) + JetBrains Mono (monospace)
- Section headers: 11px mono, 700 weight, 0.14em tracking, uppercase
- Stat labels: 10px mono, 600 weight, 0.14em tracking, uppercase
- Large stat values: 22px Outfit, 800 weight, -0.04em tracking
- Signal values: 15px, 700 weight, color-coded, capitalized
- Body text: 14–15px, 400–500 weight, var(--text-2)
- Badge text: 12px, 600 weight, 0.01em tracking

### Color Palette
| Semantic | Color | Usage |
|---|---|---|
| Primary accent | #14b8a6 (var(--accent)) | Buttons, links, badges, "Good opportunity" |
| Positive | #14b8a6 | "Strong opportunity", rising trend, high reach, easy difficulty |
| Warning | #f59e0b | "Proceed with caution", medium competition, peaked trend |
| Danger | #c53030 | "Avoid for now", high competition, declining trend, risks |
| Neutral | var(--text-3) | Stable trend, day/time badges, muted badges |

### Shared Components
| Component | Props | Usage |
|---|---|---|
| `Badge` | label, color | Inline label with colored background/border (borderRadius 6) |
| `SectionLabel` | children | Uppercase mono header with divider line |
| `ScoreBar` | score, color, height? | Horizontal fill bar (0–100), animated on mount |
| `StatCell` | label, value, sub?, accent? | Grid cell with mono label + large value |

### Icons
All icons use `@phosphor-icons/react` with duotone or bold weights. No emojis in code or markup.

### Card Patterns
- Outer cards: borderRadius 12, `var(--bg-card)`, `1px solid var(--border)`, `var(--shadow-lg)` on hover
- Inner cards: borderRadius 10, `var(--bg-subtle)`, `1px solid var(--border)`, padding 16px 18px
- Grid separators: 1px gap with `var(--border)` background
- Accent cards: `var(--accent-subtle)` background, matching border at low opacity

### Spacing
- Card padding: 16px 24px (headers), 0 24px 24px (body)
- Inner card padding: 16px 18px
- Section gap: 32px (between major sections inside tabbed panel)
- Component gap: 16px (between top-level cards in left column)
- Grid gaps: 12px (cards), 1px (stat grids)

---

## Data Source Transparency

The report is designed around a clear separation between computed facts and AI interpretation:

| What the user sees | Source | Trustworthiness |
|---|---|---|
| YouTube video titles, view counts, channel names, Watch links | YouTube Data API v3 | 100% real |
| Google Trends interest chart, rising/top queries | SerpAPI Google Trends | 100% real |
| Trend direction, velocity, competition level | Computed from YouTube publish dates + view counts | Deterministic math |
| Opportunity score, Audience fit score | Computed from YouTube + Google Trends data | Deterministic math |
| Platform tier labels (Excellent/Strong/Moderate/Low) | LLM assessment based on real data | AI interpretation |
| Top angles, untapped angles, content blueprint | LLM creative output | AI interpretation |
| Risks, recommendations, competitor insights | LLM analysis of real data | AI interpretation |
| Verdict label and reason | LLM synthesis of computed signals | AI interpretation |
| Key insight | LLM distillation | AI interpretation |

The "Based on" bar at the top makes this transparent. Users can verify YouTube data by clicking Watch → links. Google Trends data is labeled "✅ Real data". AI-generated content is clearly positioned as interpretation, not fact.
