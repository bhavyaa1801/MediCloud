# Backup and recovery (free plan)

**Not available on Spark:** scheduled Firestore exports, point-in-time recovery and Cloud Storage backups all need the Blaze plan.
Do not claim automatic backups in your report.

## What this project provides instead
* **Manual JSON backup:** Admin → Settings → *Download data backup (JSON)*. Includes users, patients, doctors, staff, departments,
  appointments, record metadata, prescriptions, resources, settings and audit logs. It does **not** include medical file contents
  (`medicalRecords/*/files`) or Firebase Auth accounts/passwords.
* Run it on a schedule you can keep (e.g. weekly) and store the file somewhere safe and private.

## Recovery
1. Data lost/corrupted: create a new Firestore database/project, publish `firestore.rules`, recreate the first admin (README step 5).
2. Re-import documents from the JSON with a small Admin SDK script run from your own machine (not included; tell me if you need it).
3. Users must exist in Auth: re-create accounts (people use "Forgot password") and keep each `users/{uid}` doc consistent with the new UIDs.

## Availability / scaling (what the managed services give you)
Firebase Auth and Firestore are managed, replicated and autoscaled by Google (Spark is limited by daily quotas, not by servers);
Vercel serves the static frontend from its global CDN with HTTPS. No custom load balancer is needed.
