# Disha — User Experience and Technical Specification

## 1. Experience goals

Disha should feel like a calm, practical career companion for students and parents—not a school portal, diagnostic test, college advertisement or developer dashboard. The main experience is the conversation and useful result. A student should be able to explore without an account and without providing sensitive information.

**Primary user journey:** arrive → choose a decision area or ask a question → answer only useful clarifying questions → compare a small set of options → inspect sources and caveats → save/share a parent summary by explicit action → leave with one practical next step.

## 2. Screen hierarchy

### A. Welcome / conversation home

- Product name “Disha” and a one-sentence description: “Explore education and career options with clear explanations and official sources.”
- Concise, non-alarming boundary: “Disha helps you compare options; you and your family make the decision. Current requirements must be checked with official sources.”
- Optional start chips: `After Class 10`, `After Class 12`, `Explore a career`, `Compare colleges/courses`, `Plan applications`.
- Chat history, message composer, send button, optional real mic control, file upload only if enabled, and a new-chat/reset action.
- Show a short privacy link near uploads/voice. Do not require sign-in for basic text guidance.

### B. Conversation and answer presentation

Use a clean message layout with readable line length and distinct user/agent turns. For longer responses, group them into:

- What I heard / key priorities.
- Options to compare.
- Pathway and prerequisites to verify.
- Cost components (show sourced numbers only; otherwise list categories to estimate).
- Trade-offs and what this route may keep open or restrict.
- Official sources, with source title, domain and relevant effective year/date when known.
- One next step.

A compact comparison table should include only columns that help the decision, for example `Path`, `What it may lead to`, `Important prerequisites to verify`, `Trade-offs`, `Cost factors`. On a narrow screen, use stacked option cards or an accessible horizontally scrollable table with a clear label. Do not bury source citations in a footnote that is impossible to reach on mobile.

### C. Parent summary

A clear action generates a short, printable/shareable summary from current conversation content. It should show the student's stated interests (no extra inference), options discussed, trade-offs, verified facts with links, unresolved questions, and next steps. Before any copy/download, show a preview so the student can correct or remove information. No automatic email, direct parent contact or cloud publication. Avoid identifying information by default.

### D. Settings (compact, secondary)

Include language preference if supported, answer style preset (Friendly Expert / Question-Led Coach / Calm Guide), privacy explanation, session reset, voice availability/permission, upload availability, and persistent-profile status. A setting changes style only; it cannot override scope, safety or verified-source rules. Show saved-profile controls only when the storage and consent features genuinely work.

### E. Separate developer/test view

Optional, separate route or a protected developer-only view. It may show test input/output (synthetic data only), selected model config, tool availability, error category, latency, grounding citations and verification timestamps. It must not display API keys, hidden reasoning, raw private student records, or the system prompt to normal users. In a student prototype, it is acceptable to document testing outside the app rather than build this view.

## 3. Visual design system

- **Responsive, mobile-first:** most students will use a phone; ensure desktop is not a stretched phone mockup.
- **Tone:** grounded, welcoming, modern, editorial. Avoid childish cartoon motifs, gamified scoreboards, excessive gradients and a “future prediction” aesthetic.
- **Colour:** choose a restrained accessible palette with a light neutral canvas, high-contrast dark text, and one calm accent used consistently for primary actions and source cues. Use colour with text/icons so status is never colour-only.
- **Type:** use a legible system sans-serif or widely available web font. Prioritise x-height and readable body sizes. Clear hierarchy for the question, answer headings, caveats and source list.
- **Spacing:** generous whitespace and limited card borders/shadows. Use cards for options and sources only when they help scanning.
- **Icons:** pair with visible labels for mic, upload, copy, reset and save/delete controls.
- **Motion:** subtle; respect `prefers-reduced-motion`. Never simulate a live transcription or a real search event with decorative animation.

## 4. Interaction and accessibility

- All actions work using keyboard and screen reader labels; focus state is clearly visible. Enter sends where expected; Shift+Enter inserts a new line if multiline input is supported.
- After a message is sent, announce response status to assistive technology. Keep focus predictable and avoid moving it into a new answer unexpectedly.
- Use responsive text sizing, strong contrast, meaningful headings, semantic buttons/inputs and readable error text. Don't rely on placeholders as the only input labels.
- Show a real loading state during a genuine request, and prevent duplicate sends while a request is in progress. Preserve unsent text when recoverable errors occur.
- Provide `Stop` only if the request/stream can actually be stopped. Provide `Retry` only when a retry will make a real new request.
- Do not show answer-confidence percentages unless they are built from a defensible evaluated method. Never offer a career-fit score as a diagnosis or destiny.
- Respect student choice: skip buttons for optional questions; avoid an interrogation flow. Let students change their mind, and update the comparison instead of defending an earlier answer.

## 5. Voice flow (optional advanced integration)

Use a genuine currently supported Live API/streaming transcription path only if the selected environment, model and browser support it.

1. Before first voice use, explain mic access and AI processing; request browser permission only after the user explicitly starts.
2. Show listening/connecting state based on actual API status.
3. Display actual partial/final transcript events as supplied by the supported transcription path. Clearly distinguish interim words from final transcript and allow correction where supported.
4. Use the actual supported spoken-output stream if enabled. Keep text response synchronized with the response content, not fabricated from a separate transcript.
5. Support stop/end and interruption only where supported. On permission denial, network failure, unsupported browser or Live API error, show a clear message and move back to text input.
6. Handle mixed-language/Hinglish gracefully if the selected model supports it; do not promise every language works equally well. Provide text fallback.
7. Do not store raw audio by default and do not claim audio never leaves the device unless that is technically true.

If the current API does not deliver reliable synchronized transcription, do not call the experience “live transcription.” Either implement a separate compatible transcription path and disclose its behaviour, or disable voice for this version.

## 6. Upload flow (optional)

- Show upload only if the app can actually pass supported files through a working server-side flow.
- State accepted file types/size and purpose clearly.
- Before selection, advise: redact full name, date of birth, address, photo, Aadhaar, roll/application numbers, QR/barcodes, signatures and irrelevant details. No Aadhaar or identity document requests.
- State that the file will be processed by the configured AI service. Do not say “private/on-device” unless true.
- Limit accepted MIME types and sizes server-side, scan/validate where available, reject unsupported/encrypted/corrupt files gracefully, and avoid trusting client file extensions alone.
- If a temporary server file is created, delete it after processing when the implementation allows. Never save raw upload to a profile by default.
- Present extracted facts with uncertainty and ask the student to confirm them. Do not make an eligibility determination from image reading alone.
- If safe upload handling is not working, disable it and test with synthetic/redacted material; the chat must remain fully usable.

## 7. Honest states and failure handling

Create real UI states for:

- First visit / no messages.
- User thinking/typing, message sending, model working, response streaming if supported.
- Verified source results and source metadata.
- No official source found / conflicting sources / old source / source unavailable.
- Grounding quota or service outage; retry and text fallback.
- API/authentication failure; helpful message without stack traces or credentials.
- Mic permission denied, browser unsupported, Live API unavailable, connection lost.
- Unsupported/oversized file, upload failure, document too blurry to interpret.
- Saved profile unavailable, consent pending, save/delete failed, and successfully saved/deleted only after confirmation from the data service.
- Session reset confirmation if it discards active conversation.

Never paint a source as “verified” because a spinner ended. Verification status comes from actual retrieved source metadata and the application's rules.

## 8. Architecture and communication flow

`user input → client-side validation → server input validation → session context and curated knowledge → model call with system-level instruction → optional official-source retrieval/grounding → validation/formatting of response and actual citations → UI result and next-step actions`

### Client

- Renders messages, comparisons, source links, parent-summary preview, controls and accurate loading/error states.
- Holds temporary UI state only; do not put API keys or privileged service credentials in client bundles, local storage or URLs.
- Do not store sensitive messages in analytics by default.

### Server

- Uses server-side secrets/environment variables for Gemini and third-party credentials.
- Validates request size, file type/size, allowed tool actions and session/user ownership.
- Sends the actual system instruction from `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` through the API's system-instruction mechanism.
- Calls the current supported model/SDK and tool APIs, maps actual citation metadata into a consistent response format, and distinguishes grounded from non-grounded output.
- Restricts retrieval tools and handles timeout/quota errors. Never fetch arbitrary untrusted URLs without defensive validation. Prefer documented grounding/retrieval methods.
- If there is no database, don't pretend persistent state exists. If Firebase or another database is added, configure server-side access and enforce per-user authorization.

### Model/tool orchestration

Use one agent with tools; no sub-agent orchestration is needed for this scope. Use the curated knowledge pack for stable terminology, and live official-source retrieval for changing facts. Use only supported functions in the current environment. If Google Search grounding cannot be restricted to official sources, inspect each returned citation and clearly label secondary sources as context rather than authority.

### External actions

The MVP does not book mentors, send applications, email parents, pay fees, create external accounts, or change records. Those would require least-privilege integrations, explicit confirmation and a reviewed safeguard process. Do not add them as fake buttons.

## 9. Integrations and cost notes

- AI Studio Build currently documents a React web client and Node.js server runtime for full-stack apps, secrets management and possible Firebase integration; confirm current options in the project.
- Google Search grounding can provide actual citation annotations, but costs and model support depend on current documentation/project configuration. Verify pricing before use in a group demo.
- Voice requires a supported Live API model, secure connection/session setup and browser permission. Do not expose long-lived secrets to the client.
- Persistent profile requires real authentication, database rules, consent gate, data review/edit/delete and appropriate legal review. If not done, keep it disabled.
- No integration or usage tier is promised to be free or automatically covered by an institutional account. Check project billing and available quota before tests.

## 10. MVP definition of done

- Text chat is connected to a real model call and uses the runtime system instruction.
- The app explains options without selecting a career for the student.
- Current details cite actual current official sources or clearly say verification failed.
- Comparison and parent summary work with real current-session content.
- Any enabled voice, upload or profile feature is genuinely functional; otherwise it is disabled honestly.
- Privacy, errors, accessibility and mobile layouts have been tested.
- At least ten scenarios from the test plan are run and statuses captured honestly.
