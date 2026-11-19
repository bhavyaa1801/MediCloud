# Security report (free-plan, rules-based design)

## What is enforced (in `firestore.rules`)
| Control | How |
|---|---|
| Authentication required for all data | every match requires `signedIn()`/`active()` |
| Role stored server-side-trusted | `users/{uid}.role`; clients cannot set role/status/profileId (update allowlists); self-registration can only create a **patient** |
| No public doctor/receptionist/admin creation | `users` create rule: only an admin may create doctor/receptionist accounts; admin must be created by hand in the console |
| Instant deactivation | `active()` checks `users/{uid}.status` on every request |
| Own-data access | patients read only their appointments/records/prescriptions; doctors only theirs; reads are `where`-constrained (rules are not filters) |
| Doctor ↔ patient authorization | `patients/{id}/careTeam/{doctor}` created in the booking commit; doctors read a patient only if it exists |
| Receptionist least privilege | no access to records, prescriptions, resources, audit logs, roles, user status |
| No double booking | create-only deterministic slot doc + same-commit appointment (`getAfter`) + client transaction |
| Status transitions | `validTransition()`; patients can only cancel, and only outside the cancellation window (`request.time` vs `startAt`) |
| Medical files private | only owner / authoring doctor / admin can read the `files/main` doc |
| Audit log | append-only; actor must equal the signed-in user (cannot impersonate, edit or delete) |
| Notifications | readable/updatable (`isRead` only) by the owner |
| Counters | may only increase by 1 |
| No secrets in the repo | Firebase web config is public by design; no service-account keys are used in this build |

## What the free plan cannot enforce (be upfront about these)
1. **Rules are untested.** Test with the console Rules Playground and the walkthrough in the README before trusting them.
2. A hand-crafted request can: book a slot outside the doctor's hours (rules do not check the schedule), create notification spam for others,
   or write misleading denormalised fields (names, fee) on an appointment it is allowed to create.
3. Audit entries are written by the browser; a user can only log *as themselves* but could skip logging. Failed logins are not audited.
4. Resource (room/bed) conflict checks are in the admin's browser transaction, not in rules (writes are admin-only).
5. Files are limited to 700 KB and live in Firestore (counts toward the 1 GiB free storage and read quota).
6. No App Check / rate limiting (needs extra setup); Firebase Auth provides basic abuse throttling.
7. Free quotas: 50K reads and 20K writes per day; each rule lookup of another document counts as a read.
8. Real patient data would need compliance review. This project uses synthetic data only.

## Upgrade path
`optional-blaze-upgrade/` contains a Cloud Functions backend (server-side validation, custom claims, private Storage, scheduled backups,
rate limits, tests). Moving there requires the Blaze plan and re-pointing `services/live/*` at callables.
