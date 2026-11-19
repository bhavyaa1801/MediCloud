# Optional: Cloud Functions backend (requires the paid Blaze plan)
This is the earlier server-side backend (30 callable functions, private Storage, scheduled backups, emulator tests).
It is NOT used by the free build. Files: `functions/`, `firestore.rules` (read-only client rules for the Functions design),
`storage.rules`. To use it you would upgrade to Blaze, deploy these, and switch `src/services/live/*` back to callables.
It predates the receptionist role and the free-plan data model, so it needs updating before use.
