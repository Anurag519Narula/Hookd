# Hookd — V1 Execution Plan

> Backend is ahead of product experience. The job now is **making value obvious in 10 seconds**. Ship output quality + trust first, retention second, intelligence moat third.

**Win condition:** User types half-baked idea → gets sharp, specific, confidence-building plan in 20 seconds.

---

## Guiding Principle

> Use engineering discipline to remove friction, then use psychology to create return behavior.

**What users must feel:**
- Smart
- Ahead of others
- Validated
- Excited to start

**True hierarchy:**
1. Output quality — "this is surprisingly usable"
2. Trust — "this is based on real data, not GPT fluff"
3. Speed — wow moment under 60 seconds
4. Activation clarity — user knows exactly what to do next
5. Retention loops — reasons to come back tomorrow

---

## Phase 1: Output Quality + Trust (This Week)

These directly affect whether a user says "damn this is useful" or closes the tab.

### 1A. Idea Clarifier (Interactive)

**Problem:** Vague input like "cricket page" or "weekly news" poisons downstream research — weak search queries → weak trend signals → generic report. APIs are limited (30 Instagram calls/month), so don't waste them on vague ideas.

**Solution:** Ask domain-level clarifying questions before validation. Max 2–3 questions. Keep it conversational, not technical.

**Key principle:** Ask about the domain/topic, not about content strategy. Creators don't think in "angles" or "audience segments" — they think in topics. "What field?" not "What's your angle?"

**Flow:**
1. User types vague idea on Studio page → idea is saved to Vault immediately (status: `raw`)
2. Validation is NOT triggered automatically
3. When user clicks "Validate" → system checks if idea is concrete enough
4. If vague: show 1–2 clarifying questions about the domain, with suggested options + a free text input
5. User picks an option or types their own answer
6. System builds a concrete research query from raw idea + answers
7. Only then trigger validation (YouTube + Instagram + Groq)

**Question design — domain-focused, not strategy-focused:**

Example: User types "weekly news"
- Q1: "What kind of news?" → options: Tech & AI / Finance / Sports / Entertainment / Politics / Business + free text field
- Q2 (if still broad): "Who are you making this for?" → options: Students / Working professionals / General audience + free text field

Example: User types "cricket page"
- Q1: "What part of cricket?" → options: IPL reactions & memes / Match analysis / Player stories / Cricket news / Fantasy cricket tips + free text field

Example: User types "ai for students"
- Q1: "What about AI for students?" → options: AI tools for studying / AI career advice / AI project tutorials / AI news simplified + free text field

**Rules:**
- Max 2–3 questions, never more (dropoff risk)
- Every question has 4–6 suggested options as clickable chips
- Always include a free text input so user can type something else
- Questions are about the domain/topic, never about content strategy (no "what's your angle" or "what format")
- If the idea is already specific enough (e.g., "why SIP investors quit early"), skip clarification entirely

**Why this matters:**
- Protects limited API quota (don't burn calls on "gym niche")
- Produces dramatically better InsightReports
- User feels guided, not interrogated

**Implementation:**
- New function: `assessIdeaClarity(rawInput)` → returns `{ isClear: boolean, questions: Array<{ question: string, options: string[] }> }`
- Quick Groq call to determine if idea needs clarification and generate domain-relevant options
- New API endpoint: `POST /api/studio/clarify` → returns questions with options
- Frontend: show question cards with clickable option chips + free text input
- After answers collected, build expanded query and proceed to normal validation flow

**Vault behavior:** Ideas saved immediately on entry (fire-and-forget tagging still works). Validation only happens when user explicitly triggers it AND idea is concrete.

### 1B. Research / Evidence Panel (with YouTube Links)

**Problem:** Users think it's random AI nonsense without visible proof.

**Solution:** Surface source data as a visible "Based on" card at the top of every InsightReport. Include clickable YouTube video links so users can verify the data themselves.

**Show:**
- X YouTube videos analyzed
- Avg views across top 5
- Top channel names
- Instagram hashtag competition tier
- Top 3–5 videos with title + view count + clickable "Watch →" link

**YouTube links:** Already have video IDs from `fetchYouTubeTrends` → `YouTubeResult` objects. URL is just `https://www.youtube.com/watch?v={videoId}`. Zero extra API calls.

**Implementation:**
- Extend InsightReport response to include `topVideos: Array<{ title, videoId, viewCount, channelName }>`
- Frontend: render as clickable cards in the research panel
- Links open in new tab

### 1C. Platform Scorecard

**Problem:** Platform analysis buried in section 7 of a 13-section report = invisible feature.

**Solution:** Pull platform fit to the very top of the result page.

**Use label tiers, not fake decimals:**

| Platform | Fit | Why |
|---|---|---|
| Instagram Reels | Excellent | High visual potential, trending hashtags available |
| YouTube Shorts | Strong | Good search intent, keyword-rich topic |
| LinkedIn | Low | Too casual for professional audience |

Fit labels: Excellent / Strong / Moderate / Low

**Implementation:** Add `platform_scores` to InsightReport output. New prompt section that rates each platform with a tier label + one-line reason.

### 1D. Emotional Output Copy

**Problem:** Reports read like data dumps, not actionable intelligence.

**Constraint:** Grounded optimism, not hype. Never say "massive opportunity" or "huge upside." Be confident, specific, and honest. If the niche is tough, say so with a path forward.

**Implementation:** Prompt engineering change in `insightSynthesis.ts`.

### 1E. Fallback Stack

Current state: every external API failure returns `502`. Fix this.

| Level | Condition | Behavior |
|---|---|---|
| Live Mode | All APIs work | Normal report |
| Cached Mode | YouTube / IG API fails | Query `api_cache` by similar niche + keywords |
| AI Estimate Mode | All external APIs fail | Groq receives niche + idea text only → estimated report |

Serve the best available data silently. Don't tell users which mode they're in — protects API quota.

### 1F. Topic Guardrails

Lightweight topic blocklist in `sanitize.ts` — regex patterns for illegal business ideas, harmful health advice, sexual exploitation, hate/extremism, plagiarism spam.

### 1G. Staged Loading UX

Show progress stages on frontend even if backend is one call. Perceived speed matters.

---

## Phase 2: Retention (Next Week)

### 2A. Save & Browse Previous Reports
Make cached InsightReports browsable from Vault with a "View Report" button.

### 2B. Instrumentation — `analytics_events` table
Track activation funnel: signup → onboarding → first idea → first validation → first caption copied → return visit.

### 2C. Vault Search
Add `q` query param to `GET /api/ideas`. PostgreSQL full-text search.

### 2D. Daily Idea Drop
Single Groq call per niche per day → 3 ideas. Cache with 24h TTL.

### 2E. Shareable Idea Scorecard
Shareable card with niche score + platform fit + verdict. Viral loop for organic growth.

### 2F. Creator Streak (gated)
Only show after 3+ actions completed.

### 2G. Output Feedback Buttons
👍 Useful · 👎 Weak · 🔁 Retry — stored as analytics events.

---

## Phase 3: Intelligence Moat

### 3A. Google Trends Integration
### 3B. Competitor Creator Intelligence
### 3C. Trend Dashboard
### 3D. Personalization Engine
### 3E. Hook Intelligence

---

## What to Avoid

- Pricing plans
- AI agent architectures
- Team collaboration
- Full notification engine
- Job queue infrastructure
- Overcomplicated moderation systems
- Decimal precision on scores (use tier labels)
- Exposing data source mode to users (live/cache/estimated)

---

## The Test

Before calling V1 done, test with 5 people (live screen share):
1. Would you use this again tomorrow?
2. What would make this worth paying for?
3. What confused you?
4. What felt fake?
5. What was the best part?
