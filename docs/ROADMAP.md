# Hookd — Final Instagram Intelligence Upgrade Plan (Non-Disruptive, Kiro Implementation File)

> This is the final implementation document for upgrading Hookd into an Instagram-first Creator OS **without disrupting any existing architecture, flows, routes, or working systems**.

> Primary goal: Make Hookd dramatically more valuable for Instagram Reels creators while preserving everything already built.

> Kiro should follow this file exactly.

---

# 0. Golden Rule (Critical)

## DO NOT BREAK EXISTING FLOW

Current Hookd flow must remain:

```txt
Vault → Studio Validate → Insights Report → Plan Your Script → Develop → Amplify
```

This flow is strong and should stay unchanged.

## DO NOT REMOVE ANY EXISTING FEATURE

Keep:

* Vault async idea tagging
* Studio clarifier flow
* `/api/insights`
* existing caching layers
* computedSignals.ts
* existing hero stat strip
* existing report layout
* Plan Your Script CTA
* Develop page
* Amplify conversations
* current prompts
* all existing routes

## THIS PROJECT IS AN ENHANCEMENT PROJECT

We are layering Instagram intelligence **on top** of Hookd.

---

# 1. Final Product Positioning

Hookd becomes:

> AI Creator OS that validates ideas and helps creators grow on Instagram Reels.

Not a rewrite.
Not a pivot.
An enhancement.

---

# 2. What Gets Built

Two phases:

# V1 = Immediate Value

Focus on creator usefulness after clicking Validate.

# V2 = Growth Moat

Advanced intelligence / retention systems.

---

# 3. Existing Hookd Architecture To Respect

## Backend

Keep:

```txt
server/src/routes/insights.ts
server/src/services/computedSignals.ts
server/src/prompts/insightSynthesis.ts
server/src/routes/amplify.ts
server/src/prompts/amplify.ts
```

## Frontend

Keep:

```txt
client/src/pages/Studio.tsx
VerdictCard
PlatformScorecard
ResearchPanel
SearchTrendsSection
Sticky Sidebar
```

No destructive edits.

---

# 4. Core Philosophy

Current Hookd proves:

* Is idea good?
* Is trend real?
* Is competition high?

Now Hookd must also prove:

* Will this work on Reels?
* What hook should I use?
* What format should I film?
* How should I caption it?
* Is niche saturated?

---

# ==================================================

# V1 IMPLEMENTATION

# ==================================================

# 5. V1 Backend Additions

Create:

```txt
server/src/services/instagramIntelligence.ts
server/src/types/instagram.ts
```

---

# 6. New Output Type

Create type:

```ts
export interface InstagramSignals {
  reelPotential: {
    score: number
    label: "High" | "Medium" | "Low"
  }

  hookStrength: {
    score: number
    label: "Strong" | "Moderate" | "Weak"
  }

  saveability: {
    score: number
    label: "High" | "Medium" | "Low"
  }

  saturation: {
    score: number
    label: "High" | "Medium" | "Low"
  }

  bestFormat: string
  captionStyle: string
  hookIdeas: string[]
  hashtagPack: string[]
}
```

---

# 7. How To Compute V1 Signals

## reelPotential

Use:

* current trendScore
* audienceFit
* opportunity score
* niche popularity

Formula:

```txt
40% opportunity
30% trend
20% audience fit
10% niche demand
```

---

## hookStrength

Use idea text.

Strong if contains:

* curiosity
* pain point
* money
* mistake
* secret
* transformation
* controversy

Weak if generic:

* daily vlog
* random motivation
* generic tips

---

## saveability

Strong if educational / checklist / finance / tools / systems / mistakes.

Weak if random entertainment.

---

## saturation

Use:

* existing competition score
* repeated keyword volume
* top channel dominance

High competition = High saturation.

---

# 8. V1 Hook Generator (Very Important)

Generate 3 hooks inside validation report.

These hooks are NOT Develop hooks.

These are instant reel hooks.

Example:

Input:
Rich habits of Indians

Output:

1. Rich Indians never waste money on this one thing.
2. Middle class people do this daily. Rich people never do.
3. 5 habits that silently make Indians wealthy.

Hooks should be sharp and creator-ready.

---

# 9. Best Reel Format Engine

Return one of:

```txt
Talking Head
Faceless B-roll
Carousel Reel
Voiceover Story
Screen Recording
Before / After Style
Green Screen Commentary
```

Examples:

Finance → Talking Head / Faceless
AI tools → Screen Recording
Mindset → Talking Head
Story → Voiceover

---

# 10. Caption Style Engine

Return:

```txt
Bold
Curious
Authority
Personal
Minimal
Storytelling
```

---

# 11. Hashtag Pack V1

Use current hashtag intelligence.

Return 8-12 tags.

Mix:

* 3 broad
* 5 mid
* 2 niche

No spam tags.

---

# 12. Route Integration

Modify:

```txt
server/src/routes/insights.ts
```

Current flow stays same.

Only add:

```ts
const [existingInsights, instagramSignals] = await Promise.all([
 existingPipeline(),
 getInstagramSignals(...)
])
```

Then merge into final response:

```ts
report.instagram = instagramSignals
```

Parallel only.

No sequential slowdown.

---

# 13. Prompt Update

Modify:

```txt
server/src/prompts/insightSynthesis.ts
```

Tell LLM:

* Existing metrics stay same
* If instagram block exists, use it in explanations
* Never overwrite computed numbers

---

# 14. Frontend Changes (Studio Page)

Modify:

```txt
client/src/pages/Studio.tsx
```

Do NOT redesign page.

Only add sections.

---

# 15. Insert New Section Order

After:

```txt
PlatformScorecard
```

Insert:

# Instagram Playbook Card

Contains:

## Top row stats

* Reel Potential
* Hook Strength
* Saveability
* Saturation

## Hooks Section

Show 3 copyable hooks.

## Format Section

Best Reel Format

## Caption Style

Recommended tone

## Hashtag Pack

Clickable copy tags

---

# 16. Sidebar Additions

Keep existing sidebar.

Add:

```txt
Reel Potential
Best Format
Caption Style
```

---

# 17. Develop Integration

Current flow unchanged.

When user clicks a hook in Instagram Playbook:

Pass selected hook to Develop page.

If no hook selected:

Current behavior remains.

---

# 18. Amplify Integration

Modify prompts only.

Inject:

```txt
Best format
Caption style
Hashtag pack
Hook tone
```

No UI disruption required.

---

# 19. Vault Upgrade (Optional in V1)

Show tiny chips:

```txt
📱 Talking Head
🔥 High Reel Potential
```

Only if data exists.

---

# ==================================================

# V2 IMPLEMENTATION

# ==================================================

# 20. Trending Audio Intelligence

Create:

```txt
server/src/services/audioTrends.ts
```

Return:

```ts
[
 { name, trendLevel, nicheFit }
]
```

Add inside Playbook later.

Not V1 priority.

---

# 21. Competitor Reel Scanner

Analyze:

* common reel styles
* hook repetition
* opportunity gaps

Show:

```txt
Everyone doing "3 mistakes"
Try story-led angle instead
```

---

# 22. Posting Window Intelligence

Use heuristic guidance only:

Finance:
weekday mornings / evenings

Students:
late afternoons / evenings

Fitness:
early mornings / evenings

Lifestyle:
evenings / weekends

Display as:

> Generally strong posting windows for this niche.

Later evolve with creator analytics if integrated.

---

# 23. Daily Idea Feed

Generate:

3 validated reel ideas by niche.

Huge retention feature.

---

# 24. Personal Growth Memory

Track:

* formats user uses
* best niches
* best hooks

Then personalize outputs.

---

# ==================================================

# WHAT NOT TO CHANGE

# ==================================================

# 25. Never Touch These

Do not rewrite:

```txt
Vault flow
Clarifier UX
Develop architecture
Amplify conversations
Current report sections
Current caching
ComputedSignals formulas
Current auth/db systems
```

---

# 26. Keep Existing Trust System

Current Hookd already strong because:

* YouTube real data
* Google Trends real data
* deterministic scoring

Keep this.

Instagram layer is additive.

---

# ==================================================

# UI INSTRUCTIONS

# ==================================================

# 27. Design Style

Use current Hookd style only.

No new random styles.

Use:

* same cards
* same border radius
* same spacing
* same muted palette
* same accent colors
* same typography

---

# 28. UX Rules

Hooks must be copyable.

Hashtags copyable.

No unnecessary modals.

No popup spam.

Fast loading.

---

# ==================================================

# PERFORMANCE RULES

# ==================================================

# 29. Parallelism Mandatory

Any new API/data work:

Use Promise.all.

No waterfall chains.

---

# 30. Cache New Instagram Layer

Use current cache infra.

Namespaces:

```txt
instagram_signals
audio_trends
```

TTL:

```txt
7 days
```

Audio:

```txt
24h
```

---

# ==================================================

# SUCCESS METRICS

# ==================================================

# 31. V1 Success

After validation user says:

> Damn, I can literally make this reel right now.

Measure:

* hook copied
* clicked Plan Script
* went to Amplify

---

# 32. V2 Success

Users return regularly for ideas.

---

# ==================================================

# FINAL BUILD ORDER

# ==================================================

## Implement V1 first

1. instagramIntelligence.ts
2. route merge
3. report UI card
4. hooks
5. format engine
6. amplify prompt injection

## Then Implement V2

1. audio trends
2. competitor gaps
3. posting windows
4. daily feed
5. personalization

---

# ==================================================

# FINAL MESSAGE TO KIRO

# ==================================================

Implement surgically.

Preserve all existing Hookd systems.

Do not refactor unrelated code.

Do not replace existing flows.

Enhance Studio validation into an Instagram-first growth engine.

If any ambiguity occurs:

Choose backward compatibility.

---

# FINAL PRODUCT RESULT

User types idea:

```txt
Rich habits of Indians
```

Gets:

* validated opportunity score
* real trend data
* reel potential
* 3 viral hooks
* best reel format
* caption style
* hashtags
* script next step

That is real product value.

---

END OF FILE
