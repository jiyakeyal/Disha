# Disha — Conversation Context, Memory and Data

## 1. The five concepts

- **Single turn:** one user message plus the response that answers it.
- **Recent conversation context:** earlier turns sent along with a new request so Disha can follow the student's current question and avoid asking for the same details again.
- **Rolling session summary:** a compact, temporary summary used if the conversation becomes too long for the model context. It should keep only facts relevant to the current guidance task.
- **Optional saved student preferences/profile:** selected information stored across sessions only after a real opt-in and the correct consent process. This is not the same as conversation context.
- **Task knowledge:** maintained career facts, source links, glossary and source rules in `03_DOMAIN_KNOWLEDGE_AND_SOURCES.md`. It is not the student's personal memory.

**Default:** session-only context. The user must not be told that a fact has been saved for another visit unless a persistent profile write actually succeeded.

## 2. Session-only data policy

For the MVP, a student can use text chat without registering or making a profile. Keep the context in the active session only. Use it to recall the student's stated interests, class stage, optional broad budget/location constraints and options already compared.

Do not ask for more personal information than is needed. Avoid the full name, exact date of birth, home address, phone number, Aadhaar/passport details, application identifiers, personal family details, identity-category information and raw financial documents. If the student wants to discuss affordability, offer broad optional ranges and allow “prefer not to say.”

The app should make its actual session behaviour clear in plain language. If a page refresh or tab close clears the conversation, disclose that before the student relies on it. If the application persists session data in browser storage or a backend, document the exact storage, deletion behaviour and retention rather than calling it “session-only” by assumption.

## 3. Rolling summary design

If needed to manage a long conversation, create a short internal summary with only task-relevant information:

```json
{
  "stage": "after_class_10 | after_class_12 | career_exploration | application_planning",
  "board_or_region": "optional, only if user shared it",
  "stated_interests": ["user-stated interests only"],
  "stated_subject_preferences": ["user-stated preferences only"],
  "constraints": {
    "region": "optional broad region",
    "budget_range": "optional broad range or null",
    "other": ["only relevant user-stated constraints"]
  },
  "options_compared": ["options already discussed"],
  "facts_to_verify": ["unresolved admissions facts and official sources to check"],
  "next_step": "one low-pressure next action"
}
```

This is a design example, not a requirement to use a literal JSON data store. Do not include full names, exact marksheet contents, identifiers, raw transcript, sensitive data or a psychological/ability label. Mark inferred information explicitly or omit it; never convert a tentative inference into a fact. Discard the summary when the session ends unless the user separately saves a supported profile.

## 4. Optional saved profile — gated feature

The team selected an optional saved profile with consent, secure storage and deletion as a desired feature. Because this is a seven-day student prototype and the audience includes minors, **do not activate persistent profiles for real minors by default**. Implement only if all requirements below are genuinely functional and have been reviewed. Otherwise show a clear “Saved profiles are not enabled in this prototype” state and continue with session-only context.

### Minimal data worth saving (only after proper opt-in)

- Chosen display nickname, optional and not required to be the legal name.
- Current education stage/class band and optional board/region if needed for future guidance.
- Selected interests/subject preferences the user explicitly chose to save.
- Options previously explored and an optional manually edited next-step checklist.
- Consent status/version, timestamp, age band needed for consent logic, and parent/guardian verification status only as far as necessary to support lawful consent. Do not retain identity verification artefacts unless specifically required by a reviewed process.

Do **not** save raw chat logs, original uploads, raw audio, detailed marks, health/psychological notes, family conflicts, full fee documents or identifiers as the default profile.

### Age and consent gate

- The product's intended audience spans ages 14–19. For privacy safeguards, treat ages **14–17 as minors** and ages **18–19 as adults**. Avoid asking for exact birth date when an age band is enough.
- Users aged 18–19 may opt in themselves, subject to the current applicable law and actual product terms.
- For users under 18, do not create or persist a profile before the legally appropriate, **verifiable** parent/guardian consent process has succeeded. A checkbox or a student typing “my parent says yes” does not itself verify authority or satisfy a legal process.
- If the group cannot implement a real consent and deletion flow in the prototype, keep the feature disabled for real accounts. Use fictional test accounts only.
- The DPDP Act/Rules and their phased implementation must be reviewed against the current official MeitY material before deployment. This document is a design safeguard, not legal advice or a declaration of compliance.

### User controls and data lifecycle

A real saved profile must have:

1. A clear opt-in that says what will be saved, why, where, who can access it and how long it is kept.
2. Separate consent for persistent preferences rather than bundling it into general app use.
3. A review screen before saving, with fields editable and optional.
4. A profile view/edit screen and a “Delete saved profile” action.
5. Confirmation before deletion and a truthful result state only after the database confirms deletion.
6. A way to withdraw consent and stop future processing; explain any limited backup/log retention if applicable.
7. Server-side authorization ensuring a user can only read/update/delete their own profile.
8. A retention period chosen for a defined purpose. Do not store a profile indefinitely by default.
9. No use of the profile for targeted ads, commercial steering or model training claims unless a separate lawful, explicit basis has been reviewed and implemented.

If a database or delete function fails, tell the user the deletion could not be confirmed and provide a clear support/contact route if one exists. Do not display a fake success toast.

## 5. Upload and voice data lifecycle

### Marksheets and checklists

- Uploads are optional, with a pre-upload reminder to redact names, roll numbers, application IDs, QR/barcodes, addresses, signatures and other identifiers.
- Explain that an image/document will be sent to the configured AI service for processing. Do not imply that processing happens locally unless it actually does.
- Do not retain raw uploaded files by default. Delete temporary server copies after processing where the implementation supports it; do not rely only on deleting a visible UI preview.
- Keep only the minimum extracted task result inside the current session, and ask the student to confirm what was read. Never save an original file to a persistent profile by default.
- If the upload/storage provider retains content under its own service terms, disclose what is known and do not promise deletion beyond the app's control.

### Voice

- Obtain browser microphone permission and explain the selected service/processing before the session starts.
- Do not store raw audio by default. Show an actual transcription from the voice API, not a simulated or reconstructed caption. Let users edit or correct the transcript where possible.
- If speech recognition or the Live API is unavailable, offer text input and say voice is unavailable. Do not pretend that voice data is not processed by the configured provider.

## 6. Access and logging

- Use server-side secrets. Never send API keys or privileged database credentials to the browser.
- Do not log complete messages, marksheets or voice transcripts in developer logs by default. Use minimal operational metadata such as request status, latency, error category and pseudonymous request/session ID where useful.
- Keep student-facing UI and any developer/test dashboard separate. Access to developer tools must be restricted; don't expose raw private content or the system prompt on the public home screen.
- Do not use third-party analytics that profile minors without an appropriate review. No ad tracking or behavioural targeting.
- A conversation summary shared with parents must be previewed by the student and copied/downloaded by an explicit action; do not send it to a parent or external party automatically.

## 7. Data-flow map

`Student message → server input validation → session context / optional curated knowledge → model call with system instruction → retrieval if required → response with real source annotations → student UI`

For an upload: `redacted file → disclosed processing path → transient extraction → student-confirmed facts → response`; delete temporary data where supported, and never persist the raw file by default.

For a saved profile (only when the feature is legitimately enabled): `explicit opt-in → correct consent verification → minimal field review → authenticated server-side write → user can view/edit/delete`. If any gate fails, do not persist; continue with session-only context.

## 8. Privacy copy (editable draft)

> Disha uses what you share in this conversation to explain education and career options. You can use text chat without creating a profile. Please don't upload Aadhaar, identity documents or files containing information you don't need us to read. If document analysis is enabled, your file is sent to the configured AI service for processing; we do not intentionally save the original file as a profile. Voice, saved-profile and storage features may be unavailable in this prototype. Check the Settings/Privacy area for the actual features enabled in this version. Never claim a deletion or consent status that the system cannot verify.

This copy must be reconciled with actual implementation and provider terms before public use; do not present it as a final privacy notice.
