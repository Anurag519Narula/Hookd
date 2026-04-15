# Requirements Document

## Introduction

RepurposeAI is a one-click content multiplier web app. A creator pastes raw content (YouTube transcript or blog post) and receives fully written, platform-native posts for Twitter/X, Instagram, LinkedIn, and TikTok — each tuned to that platform's culture, format, and audience behavior. The app has no login, no database, and no configuration step. All four platform outputs are generated in parallel via a single action.

## Glossary

- **App**: The RepurposeAI web application (React + Vite frontend, Node.js + Express backend)
- **Input_Screen**: The initial view where the user pastes raw content
- **Loading_Screen**: The transitional view showing four platform cards in shimmer/loading state
- **Results_Screen**: The final view displaying all four generated platform posts
- **Platform_Card**: A UI card representing one social platform's generated output
- **Raw_Content**: A YouTube transcript or blog post pasted by the user (minimum 100 words)
- **Generator**: The backend service that calls the Anthropic Claude API to produce platform-native content
- **Claude_API**: The Google Gemini API (model: gemini-1.5-flash) used for all AI generation
- **Twitter_Post**: A 3-tweet thread output formatted as numbered tweet bubbles
- **Instagram_Post**: A caption with hook, body, and hashtag cluster
- **LinkedIn_Post**: A flowing professional post with hook line, short paragraphs, and a closing question (150–250 words)
- **TikTok_Script**: A video script with labeled sections: HOOK, POINT 1, POINT 2, POINT 3, CTA
- **Character_Counter**: A live display of the current character count on the textarea
- **Sample_Chip**: A clickable UI element that pre-fills the textarea with sample content
- **Copy_Button**: A per-card button that copies the generated content to the clipboard
- **Regenerate_Button**: A per-card button that re-calls the Generator for a single platform
- **Start_Over_Button**: A button on the Results_Screen that resets the App to the Input_Screen

---

## Requirements

### Requirement 1: Input Screen Layout

**User Story:** As a creator, I want a clean, distraction-free input screen, so that I can focus on pasting my content and starting generation without friction.

#### Acceptance Criteria

1. THE App SHALL render the Input_Screen as a single centered column with a maximum width of 680px.
2. THE App SHALL display no navigation bar, footer, or secondary UI elements on the Input_Screen.
3. THE App SHALL render the textarea with a Character_Counter that updates on every keystroke.
4. THE App SHALL display at least two Sample_Chips that pre-fill the textarea with example Raw_Content when clicked.
5. WHEN a Sample_Chip is clicked, THE App SHALL replace the current textarea content with the chip's sample text.

---

### Requirement 2: Input Validation

**User Story:** As a creator, I want inline feedback when my content is too short, so that I understand why generation hasn't started.

#### Acceptance Criteria

1. WHEN the user submits content containing fewer than 100 words, THE App SHALL display an inline validation message without navigating away from the Input_Screen.
2. WHILE the textarea contains fewer than 100 words, THE App SHALL keep the generate button in a disabled state.
3. WHEN the textarea content meets or exceeds 100 words, THE App SHALL enable the generate button.
4. THE Character_Counter SHALL display the current word count alongside the character count.

---

### Requirement 3: Parallel Content Generation

**User Story:** As a creator, I want all four platform posts generated at once, so that I get results as fast as possible.

#### Acceptance Criteria

1. WHEN the user clicks the generate button with valid Raw_Content, THE App SHALL transition to the Loading_Screen and dispatch generation requests for all four platforms simultaneously.
2. THE Generator SHALL call the Claude_API for Twitter/X, Instagram, LinkedIn, and TikTok in parallel using Promise.all.
3. WHEN a platform's generation request completes, THE App SHALL resolve that platform's Platform_Card from shimmer state to content state independently of the other cards.
4. IF the Claude_API returns an error for a platform, THEN THE App SHALL display an error state on that platform's Platform_Card with a retry option.
5. THE Generator SHALL use a distinct system prompt for each platform encoding that platform's culture, format, and audience behavior.

---

### Requirement 4: Loading Screen

**User Story:** As a creator, I want to see live progress while my content is being generated, so that I know the app is working.

#### Acceptance Criteria

1. WHILE generation is in progress, THE App SHALL display four Platform_Cards in an animated shimmer state.
2. WHEN a platform's generation completes, THE App SHALL replace that platform's shimmer with the generated content without waiting for the other platforms.
3. THE Loading_Screen SHALL display the platform name and icon on each Platform_Card during the shimmer state.

---

### Requirement 5: Results Screen

**User Story:** As a creator, I want to see all four platform posts in a clear results view, so that I can review and copy what I need.

#### Acceptance Criteria

1. WHEN all four platform generations have completed or errored, THE App SHALL display the Results_Screen with all four Platform_Cards.
2. THE Results_Screen SHALL display a Start_Over_Button that resets the App to the Input_Screen when clicked.
3. WHEN the Start_Over_Button is clicked, THE App SHALL clear all generated content and return to the Input_Screen.

---

### Requirement 6: Copy to Clipboard

**User Story:** As a creator, I want to copy a platform post with one click, so that I can paste it directly into the platform without extra steps.

#### Acceptance Criteria

1. THE App SHALL display a Copy_Button on each Platform_Card in the Results_Screen.
2. WHEN the Copy_Button is clicked, THE App SHALL copy the full text of that platform's generated content to the system clipboard.
3. WHEN the Copy_Button is clicked, THE App SHALL change the button label to "Copied" for 1500 milliseconds, then revert to the original label.
4. THE App SHALL NOT display a toast notification or modal when content is copied.

---

### Requirement 7: Per-Platform Regeneration

**User Story:** As a creator, I want to regenerate a single platform's post without redoing all four, so that I can iterate quickly on one output.

#### Acceptance Criteria

1. THE App SHALL display a Regenerate_Button on each Platform_Card in the Results_Screen.
2. WHEN the Regenerate_Button is clicked, THE App SHALL display the shimmer state on that Platform_Card only and re-call the Generator for that platform using the same Raw_Content.
3. WHEN the regeneration completes, THE App SHALL replace the shimmer with the new generated content on that Platform_Card.
4. IF the regeneration request fails, THEN THE App SHALL display an error state on that Platform_Card with a retry option.
5. WHILE a single platform is regenerating, THE App SHALL keep the other three Platform_Cards in their current content state.

---

### Requirement 8: Twitter/X Output Format

**User Story:** As a creator, I want my Twitter/X output formatted as a thread, so that it is ready to post natively.

#### Acceptance Criteria

1. THE Generator SHALL produce a Twitter_Post consisting of exactly 3 tweets.
2. THE App SHALL render each tweet in the Twitter_Post as a visually distinct numbered bubble.
3. THE Generator SHALL write the first tweet of the Twitter_Post with a provocative, opinionated hook that does not use generic filler phrases.
4. THE Generator SHALL write each tweet in the Twitter_Post to fit within 280 characters.

---

### Requirement 9: Instagram Output Format

**User Story:** As a creator, I want my Instagram output formatted as a native caption, so that it performs well on the platform.

#### Acceptance Criteria

1. THE Generator SHALL produce an Instagram_Post containing a hook line, a body section, and a hashtag cluster.
2. THE Generator SHALL write the hook line of the Instagram_Post so that it is compelling before the "more" truncation point (approximately 125 characters).
3. THE Generator SHALL include between 5 and 15 specific, relevant hashtags in the hashtag cluster of the Instagram_Post.
4. THE Generator SHALL write the Instagram_Post in a personal, first-person tone.

---

### Requirement 10: LinkedIn Output Format

**User Story:** As a creator, I want my LinkedIn output formatted as a professional post, so that it fits LinkedIn's content culture.

#### Acceptance Criteria

1. THE Generator SHALL produce a LinkedIn_Post between 150 and 250 words.
2. THE Generator SHALL write the LinkedIn_Post with a hook line, short paragraphs, and a closing question.
3. THE Generator SHALL write the LinkedIn_Post to convey professional insight without using clichés or corporate filler language.
4. THE Generator SHALL end the LinkedIn_Post with an open-ended question directed at the reader.

---

### Requirement 11: TikTok Output Format

**User Story:** As a creator, I want my TikTok output formatted as a labeled video script, so that I can read it directly to camera.

#### Acceptance Criteria

1. THE Generator SHALL produce a TikTok_Script with the following labeled sections in order: HOOK, POINT 1, POINT 2, POINT 3, CTA.
2. THE Generator SHALL write the HOOK section of the TikTok_Script to capture attention within the first 3 seconds of spoken delivery.
3. THE Generator SHALL write the TikTok_Script in spoken-word style suitable for direct delivery to camera.
4. THE App SHALL render each labeled section of the TikTok_Script with its label visually distinct from the body text.

---

### Requirement 12: AI Prompting Quality

**User Story:** As a creator, I want the generated content to sound like me, not like a generic AI summary, so that I can post it without heavy editing.

#### Acceptance Criteria

1. THE Generator SHALL instruct the Claude_API to extract the most interesting, specific, and non-obvious ideas from the Raw_Content rather than summarizing it.
2. THE Generator SHALL instruct the Claude_API to write all output in the creator's voice, avoiding filler phrases, corporate language, and generic transitions.
3. THE Generator SHALL apply a shared base instruction set to all four platform prompts in addition to each platform's specific formatting instructions.

---

### Requirement 13: Visual Design and Typography

**User Story:** As a creator, I want the app to feel polished and typography-forward, so that the reading experience matches the quality of the content.

#### Acceptance Criteria

1. THE App SHALL use an off-white or warm gray background with near-black text and a single accent color (deep teal or warm coral).
2. THE App SHALL use Inter, DM Sans, or Plus Jakarta Sans as the primary UI typeface.
3. THE App SHALL apply generous whitespace and subtle micro-animations (e.g., shimmer, button state transitions) throughout the interface.
4. THE App SHALL NOT include a navigation bar, footer, or persistent chrome elements on any screen.

---

### Requirement 14: Session State Only

**User Story:** As a creator, I want the app to work without login or account creation, so that I can use it immediately.

#### Acceptance Criteria

1. THE App SHALL operate without requiring user authentication or account creation.
2. THE App SHALL store all generated content in client-side session state only and SHALL NOT persist content to a database or external storage.
3. WHEN the browser tab is closed or refreshed, THE App SHALL discard all session state.
