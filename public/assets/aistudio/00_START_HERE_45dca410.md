# Disha — Career Choices, Clearly
## Launch guide for the Google AI Studio Build prompt pack

**Working name:** Disha (rename after checking naming and trademark conflicts).  
**Product:** A conversational career-exploration companion for Indian students aged 14–19, with parents as co-users.  
**Prototype priority:** useful, source-grounded text conversations first; add real voice, safe document handling and optional profiles only when each integration genuinely works.

## Included files

| File | Purpose |
|---|---|
| `00_START_HERE.md` | This launch guide and known assumptions |
| `01_ONE_SHOT_BUILD_PROMPT.md` | Main instruction to paste into Google AI Studio Build |
| `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` | Runtime system instruction, examples, boundaries and persona settings |
| `03_DOMAIN_KNOWLEDGE_AND_SOURCES.md` | Starter career-guidance knowledge, source hierarchy and verification rules |
| `04_CONVERSATION_CONTEXT_AND_MEMORY.md` | Session context, optional profile, privacy and data lifecycle |
| `05_USER_EXPERIENCE_AND_TECH_SPEC.md` | Screen design, interactions, architecture, accessibility and failure states |
| `06_TEST_EVALUATE_IMPROVE.md` | Scenario tests, scoring sheet and iteration log |
| `07_TEAM_BUILD_AND_SUBMISSION_GUIDE.md` | Seven-day group plan, checks and evidence capture |

## Build steps

1. Open **Google AI Studio → Build** and choose a web app unless the current interface requires another compatible option.
2. Paste all of `01_ONE_SHOT_BUILD_PROMPT.md` into the Build prompt. Do not paste only the short project summary.
3. Attach `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` through `07_TEAM_BUILD_AND_SUBMISSION_GUIDE.md` as companion files if the current Build UI supports file attachments. If it does not, paste the essential content of the system prompt and UX/tech spec into the prompt in manageable pieces and ask the builder to confirm what it actually read. File attachment alone is not a guarantee that instructions are followed.
4. Require the builder to put the contents of `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` into the **actual server-side model system instruction** for every relevant model call. It must not merely display the prompt in the UI, put it in a user message, or rely on attached files as runtime instructions.
5. Let the builder generate the first functioning app, then use the Code view to inspect data handling and ask it to fix build/runtime errors. Test actual model responses and actual source links; do not accept mocked responses as a working AI connection.
6. Use a server-side secret manager for `GEMINI_API_KEY` and any other keys. Current AI Studio web apps may set up the Gemini key as a server-side secret automatically. Never put keys in client code, Markdown, screenshots, Git repositories, or URLs.
7. First confirm the text-chat MVP works. Add voice, web grounding, uploads and saved profiles one at a time. Follow the current official documentation linked below; model availability and API interfaces change.
8. Run the tests in `06_TEST_EVALUATE_IMPROVE.md`. Mark test statuses honestly. Do not report unrun tests as passed.

## Non-negotiable prototype safety defaults

- Prioritise students in Classes 9–12 and India-first education pathways, with Gujarat-specific sources where relevant. International study is secondary.
- The agent explains options and trade-offs; it does not choose a stream, guarantee admission, predict rank with certainty, or promise employment.
- Changing facts—deadlines, fees, eligibility, exam formats, recognition, scholarships and policy—must be checked against relevant official sources at response time. If verification fails, say so and provide the official portal to check.
- Use synthetic or redacted documents during student testing. Do not request Aadhaar, passport numbers, application IDs, full name, full date of birth, address, phone number, signatures or other unnecessary identifiers.
- Default to session-only context. An optional persistent profile may be enabled only after secure storage, consent, access, deletion, and the appropriate process for parental consent for users under 18 have been genuinely implemented and reviewed. A simple unchecked checkbox is not proof of verifiable parental consent.
- Do not connect minors to real mentors in this prototype. A referral or handoff is a future feature requiring vetted professionals, parent approval where applicable, safeguarding, moderation, and a clear complaint/escalation process.
- If real-time voice or safe uploads cannot be implemented, show an honest disabled/unavailable state and keep text chat functional. Do not simulate a live transcript, fake search, fake saved profile, or fake source verification.

## Current technical references

Verified against official pages on **28 October 2026**. Recheck before each build because products, model names, endpoints, pricing and policies change.

- AI Studio Build mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- AI Studio full-stack apps and server-side secrets: https://ai.google.dev/gemini-api/docs/aistudio-fullstack
- Gemini API grounding with Google Search and citation annotations: https://ai.google.dev/gemini-api/docs/google-search
- Gemini Live API overview, audio transcription and streaming capabilities: https://ai.google.dev/gemini-api/docs/live-api
- Gemini API pricing (verify the current project, region, model and tool costs): https://ai.google.dev/gemini-api/docs/pricing
- Digital Personal Data Protection Act and Rules: https://www.meity.gov.in/documents/act-and-policies

AI Studio Build currently documents a React web frontend and Node.js server-side runtime for full-stack web apps, server-managed secrets, and optional Firebase setup. Google Search grounding can return source citation annotations; the app must parse and display actual annotations rather than invent citations. The Live API documentation describes low-latency audio, input/output transcription and interruption support, but the team must test the actual chosen model, browser permissions and connection flow.

## Services, keys, cost and limitations

- **Gemini API:** Build may create `GEMINI_API_KEY` for server-side use. Confirm it exists in Settings → Secrets and confirm API calls run server-side. Access and billing are account/project-specific.
- **Live Search grounding:** Can improve freshness and source visibility, but it does not guarantee that every result is official or sufficient. For admissions-critical claims, inspect source domain, page context and effective year. Search grounding may incur cost; verify pricing before enabling it broadly.
- **Live voice:** Requires a compatible Live API model and session/authentication pattern supported by current docs. Do not expose a long-lived API key in the browser. If voice is blocked, keep text usable.
- **Persistent profile:** If implemented, use authenticated, access-controlled storage and a real deletion mechanism. Do not enable for real minors until the consent design and applicable legal obligations are reviewed. A student prototype can keep this feature in demo-only mode.
- **Uploads:** Only accept documented supported file types and size limits. Redact identifiers before upload. Do not retain raw files by default. Images can be misread; ask the user to confirm extracted facts.
- **Human counselling:** No live mentor marketplace, contact exchange or unsupervised messaging in the MVP.

## First-use checklist

- [ ] Text question reaches a real model call with the runtime system prompt.
- [ ] Agent asks only useful follow-up questions and does not make the student's decision.
- [ ] A current exam deadline is either supported by an official source or clearly labelled unverified.
- [ ] Sources shown in the UI are the URLs actually returned by retrieval/grounding.
- [ ] API keys are not present in client-side code.
- [ ] Uploads are optional and the app says what happens to the file.
- [ ] Voice transcript, if enabled, is generated by a genuine transcription path.
- [ ] Saved profile, if enabled, can actually be viewed, corrected and deleted; otherwise it is disabled.
- [ ] Tests are run and recorded honestly.

**Known limitation:** This pack is an implementation brief and starter knowledge resource, not a maintained admissions database or legal compliance opinion. Before public launch, the team needs an official-source update process, a privacy/legal review, safety review for minors, and realistic usability testing with appropriate adult supervision.
