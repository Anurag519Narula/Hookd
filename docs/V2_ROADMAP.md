# Hookd — V2 Roadmap

> Features parked from V1 planning. These are validated ideas that need either more data, more ideation, or V1 traction before building.

---

## Retention & Engagement

### Compare Two Ideas Side-by-Side
Side-by-side comparison of two InsightReports. Requires both ideas to have cached reports. Show platform fit, opportunity score, and verdict side by side. Helps creators decide which idea to pursue first.

### Dashboard Redesign
Transform the dashboard into the daily habit hub. Needs more ideation before coding. Potential components:
- Streak display
- Daily idea drop (3 ideas)
- Quick create box (capture bar)
- Recent outputs (last 3 captions/scripts)
- Old ideas with repurpose buttons
- Usage pulse / activity summary

### Creator Progress Score
Reframe as "Creator Output Score" based on real actions, not arbitrary points. Only build if streak engagement is strong in V1. Must feel meaningful, not gamified.

### Repurpose Workflow
On Vault idea cards where `status === 'developed'` and `created_at` is older than 7 days, show "Repurpose →" button. Navigates to Amplify with the idea pre-filled + a repurpose-oriented prompt. Keep it lightweight — not a notification system.

---

## Intelligence & Data

### Reddit Pain Point Signals
Scrape or API-fetch Reddit discussions related to the user's niche. Surface pain points, complaints, and trending topics as input signals for idea generation and insight reports.

### News / Headline Scraping
Fetch trending news headlines related to niche topics. Use as context for daily idea drops and trend validation.

### Competitor Creator Intelligence (Advanced)
Beyond basic YouTube channel names — track creator growth rates, content frequency, engagement patterns. Surface as "3 creators growing fast in your niche" with growth metrics.

### Niche Opportunity Scoring
Aggregate data across all users' searches and validations to identify underserved niches. Power a "rising niches" discovery feature.

---

## Social & Growth

### Social Account Connection
Let users connect their Instagram/YouTube/LinkedIn accounts. AI scrapes the profile to build a richer creator context. Use scraped data to further personalize all AI suggestions.

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

### Google Trends Full Integration
Complete the stubbed `fetchGoogleTrends` function. Wire into insight synthesis for real search trend data.

---

## Guiding Principle for V2

> Only build what V1 data tells you to build. Every feature should be justified by user behavior, not assumption.
