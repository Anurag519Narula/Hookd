# Requirements Document

## Introduction

This document covers two new modules added to the existing RepurposeAI app.

**IdeaVault** is a persistent idea capture and management system. Creators can quickly save raw ideas, have them automatically tagged and scored by AI, and manage them through a card-based interface with filtering and sorting.

**Hook + Caption Engine** (Develop screen) is a multi-step content development workflow. A creator starts from a raw idea — either typed fresh or loaded from the Vault — selects a hook from five AI-generated options, then receives four platform-native captions built around that hook. Captions support anchor keyword editing and feedback-based regeneration.

The existing Groq API (Llama 3.3 70B) continues to power all AI generation throughout the app.

---

## Glossary

- **App**: The RepurposeAI web application (React + Vite frontend, Node.js + Express backend)
- **Groq_API**: The Groq API (model: llama-3.3-70b-versatile) used for all AI generation
- **Generator**: The backend service that calls the Groq_API to produce platform-native content
- **Vault**: The IdeaVault feature — persistent idea storage backed by PostgreSQL
- **Idea**: A single raw text entry stored in the Vault with metadata
- **Idea_Card**: A UI card representing one Idea in the Vault grid
- **Capture_Bar**: The sticky input area at the top of the Vault screen for saving new ideas
- **Develop_Screen**: The Hook + Caption Engine screen at /develop and /develop/:ideaId
- **Hook**: A single attention-grabbing opening line with an associated psychological trigger label
- **Hook_Card**: A UI card representing one generated Hook on the Develop_Screen
- **Caption**: A platform-native post built around a selected Hook
- **Caption_Card**: A UI card representing one platform's generated Caption on the Develop_Screen
- **Anchor_Keyword**: A keyword chip on a Caption_Card that, when edited, triggers caption regeneration for that platform
- **Settings_Slide_Over**: A slide-over panel for configuring niche, sub-niche, language, and platform priority
- **Potential_Score**: An AI-assigned rating of an Idea — "low", "medium", or "high"
- **Format_Type**: An AI-assigned content format label for an Idea (e.g., "story", "talking head", "listicle")
- **Emotion_Angle**: An AI-assigned emotional framing label for an Idea
- **Vault_DB**: The PostgreSQL database used to persist ideas
- **Platform**: One of "twitter", "instagram", "linkedin", "reels"
- **Navbar**: The shared navigation bar component present on all screens
- **Results_Screen**: The existing /results page showing four platform cards
- **PlatformCard**: The existing reusable card component used on Results_Screen and Develop_Screen

---

## Requirements

### Requirement 1: PostgreSQL Database Setup

**User Story:** As a developer, I want a PostgreSQL database connected on server startup, so that ideas can be persisted reliably with a production-grade database.

#### Acceptance Criteria

1. WHEN the server starts, THE App SHALL connect to a PostgreSQL database using the `DATABASE_URL` environment variable. This connection string is obtained from Supabase (Project Settings → Database → Connection string → URI).
2. WHEN the server starts, THE App SHALL create the `ideas` table if it does not already exist, with columns: `id` (TEXT PRIMARY KEY), `raw_text` (TEXT), `created_at` (BIGINT), `tags` (JSONB), `format_type` (TEXT), `emotion_angle` (TEXT), `potential_score` (TEXT), `hooks` (JSONB), `captions` (JSONB), `status` (TEXT).
3. THE App SHALL store `tags` and `hooks` as JSONB arrays and `captions` as a JSONB object in their respective columns.
4. THE App SHALL default `hooks` and `captions` to NULL for newly created ideas.
5. THE App SHALL default `status` to `"raw"` for newly created ideas.
6. WHEN the `DATABASE_URL` environment variable is not set at server startup, THE App SHALL exit with a descriptive error log.

---

### Requirement 2: Idea CRUD Endpoints

**User Story:** As a developer, I want REST endpoints for managing ideas, so that the frontend can create, read, update, and delete ideas in the Vault.

#### Acceptance Criteria

1. WHEN `POST /api/ideas` is called with a `raw_text` body field, THE App SHALL immediately save the idea with a UUID `id`, current Unix timestamp `created_at`, and `status: "raw"`, then return the saved idea as JSON without waiting for AI tagging to complete.
2. AFTER saving the idea, THE App SHALL asynchronously call the Groq_API to generate `tags`, `format_type`, `emotion_angle`, and `potential_score`, then update the database record when the AI response arrives.
3. WHEN `GET /api/ideas` is called, THE App SHALL return all ideas sorted by `created_at` descending.
4. WHEN `GET /api/ideas` is called with query parameter `?score=<value>`, THE App SHALL return only ideas where `potential_score` matches the value.
5. WHEN `GET /api/ideas` is called with query parameter `?format=<value>`, THE App SHALL return only ideas where `format_type` matches the value.
6. WHEN `GET /api/ideas` is called with query parameter `?status=<value>`, THE App SHALL return only ideas where `status` matches the value.
7. WHEN `PATCH /api/ideas/:id` is called, THE App SHALL update only the fields present in the request body and return the updated idea.
8. WHEN `DELETE /api/ideas/:id` is called, THE App SHALL delete the idea and return a 204 status.
9. IF `POST /api/ideas` is called without a `raw_text` field, THEN THE App SHALL return a 400 status with a descriptive error message.
10. IF `PATCH /api/ideas/:id` or `DELETE /api/ideas/:id` is called with an `id` that does not exist, THEN THE App SHALL return a 404 status.

---

### Requirement 3: Hook Generation Endpoint

**User Story:** As a developer, I want a hook generation endpoint, so that the Develop screen can request five distinct hooks for a raw idea.

#### Acceptance Criteria

1. WHEN `POST /api/hooks` is called with `{ raw_idea, niche, sub_niche, language }`, THE App SHALL return a JSON array of exactly 5 Hook objects, each containing `hook_text` (string) and `trigger` (string).
2. THE Generator SHALL assign each of the 5 hooks a distinct trigger drawn from: Curiosity Gap, Identity Threat, Controversy, Surprising Stat, Personal Story Angle, Pattern Interrupt — using exactly 5 of the 6 triggers.
3. THE Generator SHALL prepend the shared base system instruction to the hook generation prompt.
4. IF `POST /api/hooks` is called without a `raw_idea` field, THEN THE App SHALL return a 400 status with a descriptive error message.

---

### Requirement 4: Caption Generation Endpoints

**User Story:** As a developer, I want caption generation and regeneration endpoints, so that the Develop screen can produce and refine platform-native captions.

#### Acceptance Criteria

1. WHEN `POST /api/captions` is called with `{ hook, raw_idea, platform, niche, anchor_keywords[], language }`, THE App SHALL return a single caption string for the specified platform.
2. THE Generator SHALL prepend the selected hook verbatim as the first line of every generated caption.
3. THE Generator SHALL incorporate `anchor_keywords` naturally into the generated caption.
4. WHEN `POST /api/captions/regenerate` is called with `{ original_caption, feedback, platform, niche, anchor_keywords[], language }`, THE App SHALL return a rewritten caption that preserves the hook and keywords while applying the feedback.
5. WHEN `POST /api/captions/regenerate` is called with an empty `feedback` field, THE App SHALL perform a full regeneration of the caption.
6. THE Generator SHALL prepend the shared base system instruction to all caption prompts.
7. IF `POST /api/captions` is called without required fields `hook`, `raw_idea`, or `platform`, THEN THE App SHALL return a 400 status with a descriptive error message.

---

### Requirement 5: Navbar Updates

**User Story:** As a creator, I want navigation links to Vault and Develop in the Navbar, so that I can move between the app's main sections without going back to the landing page.

#### Acceptance Criteria

1. THE Navbar SHALL display "Vault" and "Develop" navigation links alongside the logo.
2. WHEN a Navbar link is clicked, THE App SHALL navigate to the corresponding route (`/vault` or `/develop`).
3. THE Navbar SHALL collapse the "Vault" and "Develop" links into a hamburger menu on mobile viewports.
4. WHEN the hamburger menu icon is clicked on mobile, THE Navbar SHALL toggle the visibility of the navigation links.
5. THE Navbar SHALL continue to display the dark mode toggle in its existing position.
6. WHEN the Navbar logo is clicked, THE App SHALL navigate to `/`.

---

### Requirement 6: Vault Screen Layout

**User Story:** As a creator, I want a Vault screen where I can see all my saved ideas at a glance, so that I can manage and act on my idea backlog.

#### Acceptance Criteria

1. THE App SHALL render the Vault screen at the `/vault` route.
2. THE Vault screen SHALL display a sticky Capture_Bar at the top and a scrollable card grid below.
3. THE Vault screen SHALL display a filter bar with single-select chips: All, High potential, Medium, Story, Talking head, Unused.
4. THE Vault screen SHALL display a sort control with options: Newest, Highest potential, Oldest.
5. THE Vault screen SHALL apply filters and sorting client-side without additional API calls.
6. THE Vault screen SHALL display Idea_Cards in a 2-column grid on desktop and a 1-column grid on mobile.
7. WHEN the Vault contains no ideas, THE Vault screen SHALL display 3 ghost cards at 40% opacity with the text "Your next idea is already in your head. Get it out before it's gone."

---

### Requirement 7: Capture Bar

**User Story:** As a creator, I want a fast idea capture bar at the top of the Vault, so that I can save ideas before they slip away.

#### Acceptance Criteria

1. THE Capture_Bar SHALL display an auto-expanding textarea that grows up to 3 lines before scrolling.
2. THE Capture_Bar SHALL display a microphone button that activates Web Speech API voice input when clicked.
3. WHILE voice recording is active, THE Capture_Bar SHALL display a teal pulsing animation on the microphone button.
4. THE Capture_Bar SHALL display a clipboard paste button that reads from the system clipboard and inserts the text into the textarea.
5. THE Capture_Bar SHALL display a "Save idea" button that submits the current textarea content.
6. WHEN the Enter key is pressed in the textarea, THE Capture_Bar SHALL submit the idea.
7. WHEN Shift+Enter is pressed in the textarea, THE Capture_Bar SHALL insert a newline without submitting.
8. WHEN the "Save idea" button is clicked or Enter is pressed, THE App SHALL call `POST /api/ideas` and add the new Idea_Card to the grid immediately.
9. IF the textarea is empty when submission is attempted, THE Capture_Bar SHALL take no action.
10. THE Capture_Bar SHALL use a frosted glass visual style consistent with the app's existing design language.

---

### Requirement 8: Idea Card

**User Story:** As a creator, I want each idea displayed as a card with AI-generated metadata, so that I can quickly assess and act on each idea.

#### Acceptance Criteria

1. THE Idea_Card SHALL display the raw idea text unaltered.
2. THE Idea_Card SHALL display 2–3 tag chips in lowercase without hashtags, using the same pill style as the landing page platform pills.
3. THE Idea_Card SHALL display a colored dot indicating Potential_Score: gray for low, amber (#EF9F27) for medium, coral (#D85A30) for high.
4. WHEN the potential score dot is hovered, THE Idea_Card SHALL display a tooltip with the score label.
5. THE Idea_Card SHALL display the Format_Type label in 12px muted text.
6. WHILE AI tagging is in progress for an Idea, THE Idea_Card SHALL display shimmer placeholders in place of the tag chips, score dot, and format type label.
7. THE Idea_Card SHALL display a "Develop →" button that navigates to `/develop/:ideaId` with the idea data in route state.
8. THE Idea_Card SHALL display a "···" overflow menu with options: Mark as used, Edit, Delete.
9. WHEN "Mark as used" is selected, THE App SHALL call `PATCH /api/ideas/:id` with `status: "used"` and update the card visually.
10. WHEN "Edit" is selected, THE Idea_Card SHALL enter an inline editing mode for the raw text.
11. WHEN "Delete" is selected, THE Idea_Card SHALL animate out with a fade and THE App SHALL call `DELETE /api/ideas/:id`.
12. THE Idea_Card SHALL use the same border, hover lift, border-radius, and dark mode styles as the existing results cards.

---

### Requirement 9: Develop Screen — Idea Entry

**User Story:** As a creator, I want to open the Develop screen with or without a pre-loaded idea, so that I can develop ideas from the Vault or start fresh.

#### Acceptance Criteria

1. THE App SHALL render the Develop_Screen at the `/develop` route with an empty textarea and a "Start developing" button.
2. THE App SHALL render the Develop_Screen at the `/develop/:ideaId` route with the idea's raw text pre-loaded from route state.
3. THE Develop_Screen SHALL display the raw idea in a large, lightly-bordered, inline-editable container.
4. THE Develop_Screen SHALL display a settings row with a niche label and a pencil icon that opens the Settings_Slide_Over.
5. THE Develop_Screen SHALL display a full-width "Generate hooks" button styled in teal.
6. WHEN the "Generate hooks" button is clicked, THE App SHALL call `POST /api/hooks` with the current idea text and settings values.

---

### Requirement 10: Develop Screen — Hook Step

**User Story:** As a creator, I want to see five hook options with trigger labels, so that I can choose the angle that best fits my content.

#### Acceptance Criteria

1. WHILE hooks are loading, THE Develop_Screen SHALL display 5 shimmer Hook_Cards.
2. WHEN hooks have loaded, THE Develop_Screen SHALL fade in 5 Hook_Cards, each showing the hook text at 16px and the trigger label at 12px muted.
3. THE Develop_Screen SHALL display a "Use this hook →" button on each Hook_Card.
4. THE Develop_Screen SHALL display a "↻ Try another" ghost button on each Hook_Card that regenerates only that single hook card.
5. WHEN "↻ Try another" is clicked, THE App SHALL call `POST /api/hooks` and replace only that card's content with a new hook using an unused trigger.

---

### Requirement 11: Develop Screen — Caption Step

**User Story:** As a creator, I want platform captions to appear after I select a hook, so that I can see how the hook plays out across all four platforms.

#### Acceptance Criteria

1. WHEN a hook is selected via "Use this hook →", THE Develop_Screen SHALL slide in the caption section below the hooks.
2. THE selected Hook_Card SHALL display a teal left border. Unselected Hook_Cards SHALL dim to 50% opacity.
3. THE App SHALL call `POST /api/captions` for all four platforms simultaneously via `Promise.all`.
4. WHILE captions are loading, THE Develop_Screen SHALL display 4 shimmer Caption_Cards that resolve individually as each platform's response arrives.
5. WHEN a caption has loaded, THE Caption_Card SHALL display the platform label, platform-native content format, character count at 12px muted, and 3 editable Anchor_Keyword chips.
6. THE Caption_Card SHALL use the same visual style as the existing PlatformCard component.
7. WHEN an Anchor_Keyword chip is clicked, THE Caption_Card SHALL make that chip inline-editable.
8. WHEN Enter or Tab is pressed after editing an Anchor_Keyword, THE App SHALL save the new keyword and call `POST /api/captions/regenerate` for that platform only.
9. THE Caption_Card SHALL display a Copy button identical in style and behavior to the existing results page Copy button.
10. WHEN the Regenerate button on a Caption_Card is clicked, THE Caption_Card SHALL reveal a single-line "What to change?" input with a submit arrow.
11. WHEN the regenerate input is submitted, THE App SHALL call `POST /api/captions/regenerate` with the feedback text and replace the caption content.
12. WHEN the regenerate input is submitted with empty feedback, THE App SHALL perform a full caption regeneration for that platform.

---

### Requirement 12: Save to Vault from Develop Screen

**User Story:** As a creator, I want to save my developed hook and captions back to the Vault, so that I can preserve my work and track which ideas have been developed.

#### Acceptance Criteria

1. THE Develop_Screen SHALL display a "Save to Vault" ghost button below the caption section.
2. WHEN "Save to Vault" is clicked for an idea loaded from the Vault, THE App SHALL call `PATCH /api/ideas/:id` with the selected hook and generated captions.
3. WHEN "Save to Vault" is clicked for a fresh idea not from the Vault, THE App SHALL call `POST /api/ideas` to create the idea, then `PATCH /api/ideas/:id` to attach the hook and captions.
4. WHEN the save completes successfully, THE "Save to Vault" button SHALL change its label to "Saved ✓" and become non-interactive.

---

### Requirement 13: Capture to Vault Integration on Results Screen

**User Story:** As a creator, I want to capture a new idea directly from the Results screen, so that I can save inspiration that comes while reviewing generated content.

#### Acceptance Criteria

1. THE Results_Screen SHALL display a slim banner above the four platform cards with the text "Got a new idea from this content?" and a "Capture to Vault →" CTA.
2. WHEN "Capture to Vault →" is clicked, THE App SHALL open a slide-over panel containing the Capture_Bar component with the textarea pre-focused.
3. WHEN an idea is submitted from the slide-over panel, THE App SHALL call `POST /api/ideas`, close the panel, and dismiss the banner for the remainder of the browser session.
4. THE banner and slide-over SHALL use the same frosted glass and gradient visual language as the rest of the app.

---

### Requirement 15: Settings Slide-Over

**User Story:** As a creator, I want to configure my niche, language, and platform preferences once, so that all generated hooks and captions are tailored to my content context.

#### Acceptance Criteria

1. THE Settings_Slide_Over SHALL be accessible from the Develop_Screen settings row and from the Navbar.
2. THE Settings_Slide_Over SHALL contain a primary niche text input with autocomplete suggestions: Fitness, Finance, Travel, Food, Parenting, Tech, Beauty, Mental Health, Business, Gaming, Education, Lifestyle.
3. THE Settings_Slide_Over SHALL contain an optional sub-niche text input.
4. THE Settings_Slide_Over SHALL contain a language dropdown with options: English, Hindi, Spanish, Portuguese, French, Arabic.
5. THE Settings_Slide_Over SHALL contain a drag-to-reorder list of the 4 platforms for platform priority.
6. WHEN the Settings_Slide_Over is closed, THE App SHALL persist all settings values to `localStorage`.
7. WHEN the App loads, THE App SHALL restore settings values from `localStorage` if present.
8. THE App SHALL include the niche, sub-niche, and language values in the request body of all `POST /api/hooks` and `POST /api/captions` calls.

---

### Requirement 16: AI Prompting Quality Standards

**User Story:** As a creator, I want all AI-generated content to sound specific, human, and platform-native, so that I can post it without heavy editing.

#### Acceptance Criteria

1. THE Generator SHALL prepend the following base system instruction to ALL prompts: "You are a content strategist who understands platform culture practically, not theoretically. You write the way creators talk: direct, specific, human, occasionally imperfect. You never use filler phrases like 'In today's world,' 'As a content creator,' or 'In this day and age.' You never start a hook with 'Have you ever.' The best content comes from a specific perspective — your job is to amplify specificity, not sand it down into something generic."
2. THE Generator SHALL score an idea as "high" potential if it is specific, personal, counterintuitive, or emotionally charged.
3. THE Generator SHALL score an idea as "low" potential if it is vague or generic.
4. THE Generator SHALL return idea tagging results as a JSON object with keys: `tags` (string array), `format_type` (string), `emotion_angle` (string), `potential_score` ("low" | "medium" | "high").
5. THE Generator SHALL return hook generation results as a JSON array of objects with keys: `hook_text` (string) and `trigger` (string).

---

### Requirement 17: Visual Consistency and Dark Mode

**User Story:** As a creator, I want all new screens to match the existing app's visual language, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE Vault screen, Develop_Screen, and Settings_Slide_Over SHALL support dark mode using the existing `data-theme` attribute mechanism.
2. THE Vault screen, Develop_Screen, and Settings_Slide_Over SHALL use the same frosted glass, gradient, border-radius, and hover lift styles as the existing screens.
3. THE Idea_Card and Caption_Card SHALL use the same card styles as the existing PlatformCard component.
4. WHEN the dark mode toggle is clicked, THE App SHALL apply the theme change to all new screens simultaneously with the existing screens.

---

### Requirement 18: Data Integrity

**User Story:** As a developer, I want all idea data stored and retrieved correctly from PostgreSQL, so that idea data is never corrupted or lost.

#### Acceptance Criteria

1. THE App SHALL store `tags` and `hooks` as native JSONB arrays in PostgreSQL and retrieve them as JavaScript arrays without manual serialization.
2. THE App SHALL store `captions` as a native JSONB object in PostgreSQL and retrieve it as a JavaScript object without manual serialization.
3. FOR ALL valid Idea objects, writing then reading `tags`, `hooks`, and `captions` from the database SHALL produce a value deeply equal to the original (round-trip property).
4. IF a database read returns NULL for `tags`, `hooks`, or `captions`, THEN THE App SHALL return an empty array or null for that field rather than throwing an error.
