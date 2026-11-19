'use strict'
// One-shot LOCAL setup (emulators only): seeds departments/resources/settings, demo doctors + patient,
// then creates an admin (you type the email/password). Works on Windows/macOS/Linux - no env vars needed.
const { spawnSync } = require('child_process')
const env = { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', GCLOUD_PROJECT: 'demo-medicloud', FIREBASE_PROJECT_ID: 'demo-medicloud' }
const run = (args) => { const r = spawnSync(process.execPath, args, { stdio: 'inherit', env, cwd: __dirname + '/..' }); if (r.status !== 0) process.exit(r.status || 1) }
console.log('1/2 Seeding reference + demo data into the emulator...'); run(['scripts/seedReference.js', '--demo'])
console.log('\n2/2 Create your admin account (emulator only):'); run(['scripts/provisionAdmin.js'])
console.log('\nDone. Demo logins (password demo1234): doctor@MediCloud.demo, patient@MediCloud.demo. Admin: the one you just created.')
