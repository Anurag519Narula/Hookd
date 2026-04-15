# Implementation Plan: RepurposeAI

## Overview

Build a stateless React + Vite frontend with a Node.js + Express backend that transforms long-form content into four platform-native social posts via parallel Gemini API calls. Implementation proceeds from project scaffolding through backend services, frontend screens, and final wiring.

## Tasks

- [x] 1. Scaffold project structure and shared types
  - Initialize Vite + React + TypeScript project in `client/` and Node.js + TypeScript project in `server/`
  - Create `src/types/index.ts` with `Platform`, `CardState`, `GenerationState`, `GenerateRequest`, `GenerateResponse`, `RegenerateResponse`, and `Screen` types
  - Set up `tsconfig.json`, `package.json` scripts, and `.env.example` with `GEMINI_API_KEY` placeholder
  - Install dependencies: `react`, `vite`, `typescript`, `express`, `@google/generative-ai`, `fast-check`, `vitest`, `@testing-library/react`
  - _Requirements: 14.1, 14.2_

- [x] 2. Implement backend prompt system and generator service
  - [x] 2.1 Create base and platform-specific prompt files
    - Write `server/prompts/base.ts` with shared base instruction set (extract specific ideas, write in creator's voice, avoid filler)
    - Write `server/prompts/twitter.ts`, `instagram.ts`, `linkedin.ts`, `tiktok.ts` with platform-specific format rules
    - _Requirements: 12.1, 12.2, 12.3, 8.3, 9.4, 10.3_

  - [ ]* 2.2 Write property test for prompt construction (Property 21)
    - `// Feature: repurpose-ai, Property 21: For any platform, constructed prompt contains base instruction text`
    - Use `fc.constantFrom('twitter', 'instagram', 'linkedin', 'tiktok')` to verify base text is present in all built prompts
    - **Validates: Requirements 12.3**

  - [x] 2.3 Implement `server/services/generator.ts`
    - Write `buildPrompt(platform, rawContent)` combining base + platform prompt + content
    - Write `generateForPlatform(platform, rawContent)` calling Gemini API (`gemini-1.5-flash` model), returning `{ content }` or `{ error }`
    - Write `generateAll(rawContent)` dispatching all four calls via `Promise.all`
    - _Requirements: 3.2, 3.4, 3.5_

- [x] 3. Implement Express routes and server entry point
  - [x] 3.1 Create `server/routes/generate.ts`
    - Validate `rawContent` present in body; return 400 if missing
    - Call `generateAll`, return combined JSON response
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Create `server/routes/regenerate.ts`
    - Validate `:platform` is one of the four valid values; return 400 otherwise
    - Validate `rawContent` present; call `generateForPlatform`, return result
    - _Requirements: 7.2, 7.3_

  - [x] 3.3 Create `server/index.ts` entry point
    - Mount routes, configure CORS for dev, fail fast if `GEMINI_API_KEY` is missing
    - _Requirements: 14.1_

  - [ ]* 3.4 Write unit tests for Express routes
    - Test `POST /api/generate` returns 400 for missing body
    - Test `POST /api/regenerate/:platform` returns 400 for unknown platform
    - _Requirements: 3.4, 7.4_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement frontend API client and hooks
  - [x] 5.1 Create `src/api/generate.ts` and `src/api/regenerate.ts`
    - Write typed `POST /api/generate` and `POST /api/regenerate/:platform` fetch wrappers
    - _Requirements: 3.1, 7.2_

  - [x] 5.2 Implement `src/hooks/useClipboard.ts`
    - Write clipboard write function that sets label to "Copied" and resets after 1500ms
    - _Requirements: 6.2, 6.3_

  - [ ]* 5.3 Write property test for clipboard hook (Property 10)
    - `// Feature: repurpose-ai, Property 10: For any Copy_Button click, label is "Copied" then reverts after 1500ms`
    - Use fake timers to verify label state at 0ms, 1499ms, and 1500ms
    - **Validates: Requirements 6.3**

  - [x] 5.4 Implement `src/hooks/useGenerate.ts`
    - Manage `GenerationState` per platform; dispatch parallel generate calls; update each card independently on resolution
    - Support single-platform regeneration that only mutates that platform's card state
    - _Requirements: 3.3, 7.2, 7.5_

  - [ ]* 5.5 Write property test for independent card state transitions (Property 5)
    - `// Feature: repurpose-ai, Property 5: For any platform resolution, only that card changes state`
    - Use `fc.constantFrom(...)` for platform; verify other three cards are unchanged after resolution
    - **Validates: Requirements 3.3, 4.2, 7.3, 7.5**

  - [ ]* 5.6 Write property test for regenerate shimmer isolation (Property 11)
    - `// Feature: repurpose-ai, Property 11: For any platform regeneration, only that card enters shimmer`
    - **Validates: Requirements 7.2**

- [x] 6. Implement shared UI components
  - [x] 6.1 Create `src/components/CharacterCounter.tsx`
    - Display live word count and character count from textarea value prop
    - _Requirements: 1.3, 2.4_

  - [ ]* 6.2 Write property test for character counter (Property 1)
    - `// Feature: repurpose-ai, Property 1: For any string, counter displays correct word and character counts`
    - Use `fc.string()` to verify word count equals whitespace-delimited token count and char count equals string length
    - **Validates: Requirements 1.3, 2.4**

  - [x] 6.3 Create `src/components/SampleChip.tsx`
    - Render clickable chip; on click call `onSelect(sampleText)` prop
    - _Requirements: 1.4, 1.5_

  - [ ]* 6.4 Write property test for sample chip replacement (Property 2)
    - `// Feature: repurpose-ai, Property 2: For any chip and any prior content, chip click sets textarea to chip text`
    - Use `fc.string()` for prior content; verify textarea value equals chip text after click
    - **Validates: Requirements 1.5**

  - [x] 6.5 Create `src/components/CopyButton.tsx`
    - Use `useClipboard` hook; show "Copied" feedback for 1500ms; no toast or modal
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.6 Create `src/components/RegenerateButton.tsx`
    - Render button that calls `onRegenerate(platform)` prop
    - _Requirements: 7.1_

  - [x] 6.7 Create `src/components/PlatformCard.tsx`
    - Render shimmer state (with platform name and icon), success state (content + CopyButton + RegenerateButton), and error state (message + retry button)
    - Render Twitter content as three numbered tweet bubbles; render TikTok section labels visually distinct
    - _Requirements: 4.1, 4.3, 5.1, 6.1, 7.1, 8.2, 11.4_

  - [ ]* 6.8 Write property test for shimmer card displays name and icon (Property 7)
    - `// Feature: repurpose-ai, Property 7: For any Platform_Card in shimmer state, card shows name and icon`
    - Use `fc.constantFrom(...)` for platform; render card in loading state and assert name/icon present
    - **Validates: Requirements 4.3**

  - [ ]* 6.9 Write property test for error card shows retry (Property 6)
    - `// Feature: repurpose-ai, Property 6: For any platform error, that card shows error state with retry`
    - **Validates: Requirements 3.4, 7.4**

  - [ ]* 6.10 Write property test for copy button writes exact content (Property 9)
    - `// Feature: repurpose-ai, Property 9: For any platform content, Copy_Button writes exact content to clipboard`
    - Use `fc.string()` for content; mock clipboard API; verify written value equals content
    - **Validates: Requirements 6.2**

- [x] 7. Implement Input Screen
  - [x] 7.1 Create `src/screens/InputScreen.tsx`
    - Render centered single column (max-width 680px), no nav/footer
    - Include textarea with CharacterCounter, at least two SampleChips, and generate button
    - Disable generate button when word count < 100; show inline validation message on submit attempt with < 100 words
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 7.2 Write property test for generate button enabled state (Property 3)
    - `// Feature: repurpose-ai, Property 3: For any string, button enabled iff word count >= 100`
    - Use `fc.string()` to verify button disabled/enabled matches word count threshold
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 7.3 Write property test for short input validation message (Property 4)
    - `// Feature: repurpose-ai, Property 4: For any string < 100 words, submit shows validation message, stays on InputScreen`
    - **Validates: Requirements 2.1**

- [x] 8. Implement Loading and Results Screens
  - [x] 8.1 Create `src/screens/LoadingScreen.tsx`
    - Render four PlatformCards; each card driven by its `CardState` (shimmer until resolved)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Create `src/screens/ResultsScreen.tsx`
    - Render four PlatformCards with content/error states and a Start Over button
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.3 Write property test for Start Over resets all state (Property 8)
    - `// Feature: repurpose-ai, Property 8: For any results state, Start Over resets to InputScreen with cleared content`
    - Use `fc.record(...)` to generate arbitrary generation state; verify all cards cleared and screen is "input" after click
    - **Validates: Requirements 5.2, 5.3**

- [x] 9. Checkpoint — Ensure all frontend component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Wire App.tsx and apply visual design
  - [x] 10.1 Implement `src/App.tsx`
    - Own `screen`, `rawContent`, and `generation` state
    - Render InputScreen, LoadingScreen, or ResultsScreen based on `screen` state
    - Pass `useGenerate` callbacks and state down to screens
    - _Requirements: 3.1, 5.2, 5.3_

  - [x] 10.2 Apply global styles and typography
    - Set Inter / DM Sans / Plus Jakarta Sans as primary typeface via CSS or Tailwind
    - Apply off-white/warm-gray background, near-black text, single accent color (deep teal or warm coral)
    - Add shimmer keyframe animation for loading cards and button state transition micro-animations
    - Remove any default nav, footer, or persistent chrome
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Write output format property tests
  - [ ]* 11.1 Write property test for Twitter 3-tweet count (Property 12)
    - `// Feature: repurpose-ai, Property 12: For any valid input, Twitter output has exactly 3 tweets`
    - Generate valid raw content with `fc.array(fc.string(), { minLength: 100 }).map(w => w.join(' '))`, call generator, assert tweet count === 3
    - **Validates: Requirements 8.1**

  - [ ]* 11.2 Write property test for tweet character limit (Property 13)
    - `// Feature: repurpose-ai, Property 13: For any valid input, every tweet is <= 280 characters`
    - **Validates: Requirements 8.4**

  - [ ]* 11.3 Write property test for Instagram structure (Property 14)
    - `// Feature: repurpose-ai, Property 14: For any valid input, Instagram output has hook, body, hashtags`
    - **Validates: Requirements 9.1**

  - [ ]* 11.4 Write property test for Instagram hook length (Property 15)
    - `// Feature: repurpose-ai, Property 15: For any valid input, Instagram hook is <= 125 characters`
    - **Validates: Requirements 9.2**

  - [ ]* 11.5 Write property test for Instagram hashtag count (Property 16)
    - `// Feature: repurpose-ai, Property 16: For any valid input, Instagram hashtag count is in [5, 15]`
    - **Validates: Requirements 9.3**

  - [ ]* 11.6 Write property test for LinkedIn word count (Property 17)
    - `// Feature: repurpose-ai, Property 17: For any valid input, LinkedIn word count is in [150, 250]`
    - **Validates: Requirements 10.1**

  - [ ]* 11.7 Write property test for LinkedIn ends with question (Property 18)
    - `// Feature: repurpose-ai, Property 18: For any valid input, LinkedIn ends with a question and has multiple paragraphs`
    - **Validates: Requirements 10.2, 10.4**

  - [ ]* 11.8 Write property test for TikTok section order (Property 19)
    - `// Feature: repurpose-ai, Property 19: For any valid input, TikTok has all 5 labeled sections in order`
    - **Validates: Requirements 11.1**

  - [ ]* 11.9 Write property test for TikTok HOOK word count (Property 20)
    - `// Feature: repurpose-ai, Property 20: For any valid input, TikTok HOOK is <= 15 words`
    - **Validates: Requirements 11.2**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations (`fc.configureGlobal({ numRuns: 100 })`)
- Output format property tests (task 11) require live Gemini API calls; use a test API key or mock the SDK in CI
