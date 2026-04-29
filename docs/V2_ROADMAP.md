# Hookd — V2 Roadmap

> V1 (Instagram Intelligence layer) and all Phase 1 features are complete and documented in `KNOWLEDGE_BASE.md`.
> This file tracks everything that comes next — prioritized by impact.

---

## Guiding Principles

- All V2 work is additive. Never break the existing flow: `Vault → Studio Validate → Insights Report → Plan Your Script → Develop → Amplify`.
- Never remove existing features. Instagram Intelligence is now part of the core product.
- Choose backward compatibility over cleverness when ambiguity arises.
- Only build what V1 data tells you to build. Every feature should be justified by user behavior, not assumption.
- Use engineering discipline to remove friction, then use psychology to create return behavior.

**True hierarchy:**
1. Output quality — "this is surprisingly usable"
2. Trust — "this is based on real data, not GPT fluff"
3. Speed — wow moment under 60 seconds
4. Activation clarity — user knows exactly what to do next
5. Retention loops — reasons to come back tomorrow

---

## What to Avoid

- Pricing plans (until retention is proven)
- AI agent architectures
- Team collaboration
- Full notification engine
- Job queue infrastructure
- Overcomplicated moderation systems
- Decimal precision on scores (use tier labels)
- Exposing data source mode to users (live/cache/estimated)

---

## Post-Launch Validation

Before moving to V2 features, test with 5 people (live screen share):
1. Would you use this again tomorrow?
2. What would make this worth paying for?
3. What confused you?
4. What felt fake?
5. What was the best part?

---

## Post-Launch Priorities

These are the remaining V1-era items that should ship before or alongside V2 features.

### Creator Streak (gated)

Only show after 3+ actions completed. Lightweight streak counter to encourage daily return behavior. Do not over-gamify.

### Trend Dashboard

Dedicated view for browsing trending topics, niches, and signals. Aggregates Google Trends, YouTube velocity, and Instagram hashtag data into a browsable discovery surface.

### Hook Intelligence

Advanced hook analysis — track which hook styles perform best across niches, surface hook patterns from top-performing reels, and feed insights back into the hook generation engine.

---

## Priority: Instagram Intelligence V2

These extend the Instagram Playbook card and deepen the Reels-first value prop.

### Trending Audio Intelligence

Create `server/src/services/audioTrends.ts`.

Return trending audio data per niche:

```ts
[
  { name: string, trendLevel: string, nicheFit: string }
]
```

Display inside the Instagram Playbook card.

**Cache:** `audio_trends` namespace, 24h TTL.

### Competitor Reel Scanner

Analyze competitor reels to surface:

- Common reel styles in the niche
- Hook repetition patterns
- Opportunity gaps

Example output:

```txt
Everyone doing "3 mistakes"
→ Try story-led angle instead
```

Extends the existing Competitor Creator Intelligence concept — goes beyond YouTube channel names to track reel-specific patterns, creator growth rates, content frequency, and engagement.

### Posting Window Intelligence

Heuristic-based posting time guidance by niche:

| Niche | Suggested Windows |
|---|---|
| Finance | Weekday mornings / evenings |
| Students | Late afternoons / evenings |
| Fitness | Early mornings / evenings |
| Lifestyle | Evenings / weekends |

Display as contextual guidance (e.g., "Generally strong posting windows for this niche").

Later evolve with creator analytics if integrated.

### Build Order (Instagram V2)

1. Trending Audio Intelligence
2. Competitor Reel Scanner
3. Posting Window Intelligence

---

## Retention & Engagement

### Daily Idea Feed

Generate 3 validated reel ideas per day, personalized to the creator's niche. Single Groq call per niche per day, cached with 24h TTL. High-retention feature — gives creators a reason to return daily.

### Dashboard Redesign

Transform the dashboard into the daily habit hub. Potential components:
- Daily idea feed (3 ideas)
- Quick create box (capture bar)
- Recent outputs (last 3 captions/scripts)
- Old ideas with repurpose buttons
- Usage pulse / activity summary
- Streak display (if streak engagement proves strong)

Needs more ideation before coding.

### Personal Growth Memory

Track over time:

- Formats the creator uses most
- Best-performing niches
- Most effective hook styles
- Face on camera comfort level
- Preferred content style
- Niche authority signals
- Previous wins / top-performing ideas

Use this history to personalize all outputs (hooks, formats, caption styles, hashtag packs) and make opportunity scores creator-specific rather than generic. Subsumes the "Creator Progress Score" concept — reframe as "Creator Output Score" based on real actions, not arbitrary points. Must feel meaningful, not gamified.

### Compare Two Ideas Side-by-Side

Side-by-side comparison of two InsightReports. Requires both ideas to have cached reports. Show platform fit, opportunity score, and verdict side by side. Helps creators decide which idea to pursue first.

### Repurpose Workflow

On Vault idea cards where `status === 'developed'` and `created_at` is older than 7 days, show "Repurpose →" button. Navigates to Amplify with the idea pre-filled + a repurpose-oriented prompt. Keep it lightweight — not a notification system.

### Save & Browse Previous Reports

Make cached InsightReports browsable from Vault with a "View Report" button.

### Vault Search

Add `q` query param to `GET /api/ideas`. PostgreSQL full-text search.

### Output Feedback Buttons

👍 Useful · 👎 Weak · 🔁 Retry — stored as analytics events.

### Instrumentation — `analytics_events` table

Track activation funnel: signup → onboarding → first idea → first validation → first caption copied → return visit.

---

## Intelligence & Data

### Real Discovery Signals Layer

Use APIs / scraping / datasets to estimate real feed-level signals:

- Reel count by niche
- Engagement density
- Creator freshness
- Save/share format patterns
- Average hook patterns

Evolves the current deterministic discovery demand scoring (`discoverySignals.ts`) with live data.

### Saturation Map

Differentiate niche saturation into actionable categories:

- Healthy saturation — competitive but room for differentiation
- Oversaturated commodity — too many identical creators
- Underserved niche — low creator count, high demand
- Emerging niche — growing fast, early mover advantage

### Dynamic Suggestion Engine

When a niche is crowded, return specific differentiation angles:

```txt
Use storytelling angle
Target oily skin audience
Use 30+ age angle
Use budget angle
Use male skincare angle
```

Context-aware suggestions based on market type + saturation level.

### Reddit Pain Point Signals

Scrape or API-fetch Reddit discussions related to the user's niche. Surface pain points, complaints, and trending topics as input signals for idea generation and insight reports.

### News / Headline Scraping

Fetch trending news headlines related to niche topics. Use as context for daily idea drops and trend validation.

### Niche Opportunity Scoring

Aggregate data across all users' searches and validations to identify underserved niches. Power a "rising niches" discovery feature.

---

## Social & Growth

### Social Account Connection

Let users connect their Instagram/YouTube/LinkedIn accounts. AI scrapes the profile to build a richer creator context. Use scraped data to further personalize all AI suggestions.

### Shareable Idea Scorecard

Shareable card with niche score + platform fit + verdict. Viral loop for organic growth.

### Shareable Weekly Snapshot

Auto-generated weekly summary: ideas captured, ideas validated, content created, best performing niche. Shareable as an image card for social proof.

---

## Platform Expansion

### TikTok Support

Add TikTok as a platform option for caption generation and platform scorecard analysis.

### X (Twitter) Support

Add X/Twitter thread generation and platform-specific writing rules.

### Carousel / Thread Formats

Support multi-slide carousel content planning and Twitter/LinkedIn thread generation from a single idea.

---

## Monetization (When Ready)

### Pricing Plans

Free tier with limited daily validations. Pro tier with higher limits, priority API access, and advanced features. Only implement after proving retention metrics.

### Usage Analytics Dashboard

Show users their own usage patterns, most productive times, best performing niches. Premium feature.

---

## Technical Debt

### Legacy Route Cleanup

Deprecate and remove legacy routes (`/api/generate`, `/api/regenerate`, `/api/hooks`, `/api/captions`) once all clients are migrated to Studio/Amplify architecture.

---

## Pending V1 Optional Items

These were marked optional in V1 and can be picked up anytime without code changes:

- **Vault chips** — Show tiny badges on idea cards (e.g., "📱 Talking Head", "🔥 High Reel Potential") when Instagram signals data exists.
- **Dedicated Instagram cache namespace** — Instagram signals are currently cached as part of the insights payload. A separate `instagram_signals` namespace (7-day TTL) can be added for independent cache control.

---

## V2 Success Metric

Users return regularly for ideas and personalized intelligence.
