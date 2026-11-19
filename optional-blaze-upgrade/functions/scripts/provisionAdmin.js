'use strict'
// Controlled, server-side admin provisioning. Run by an operator with Admin credentials:
//   ADMIN_EMAIL=you@x.com ADMIN_NAME="Hospital Admin" ADMIN_PASSWORD='<strong password>' node scripts/provisionAdmin.js
// Auth: GOOGLE_APPLICATION_CREDENTIALS (service-account file kept OUTSIDE the repo) or emulator env vars.
// No credentials are hardcoded; the password is read from the environment or prompted for.
const admin = require('firebase-admin')
const readline = require('readline')
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID })

const ask = (q) => new Promise((r) => { const i = readline.createInterface({ input: process.stdin, output: process.stdout }); i.question(q, (a) => { i.close(); r(a) }) })

;(async () => {
  const email = (process.env.ADMIN_EMAIL || await ask('Admin email: ')).trim().toLowerCase()
  const name = process.env.ADMIN_NAME || 'Hospital Admin'
  const password = process.env.ADMIN_PASSWORD || await ask('Admin password (min 12 chars): ')
  if (password.length < 12) throw new Error('Password must be at least 12 characters.')
  const db = admin.firestore()
  let user
  try { user = await admin.auth().getUserByEmail(email); await admin.auth().updateUser(user.uid, { password }) }
  catch (e) { if (e.code !== 'auth/user-not-found') throw e; user = await admin.auth().createUser({ email, password, displayName: name }) }
  const ts = admin.firestore.FieldValue.serverTimestamp()
  await db.doc(`users/${user.uid}`).set({ uid: user.uid, name, email, phone: '', role: 'admin', profileId: 'ADM-01', profileImage: null, status: 'active', createdAt: ts, updatedAt: ts }, { merge: true })
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin', profileId: 'ADM-01' })
  await db.collection('auditLogs').add({ actorId: 'script', actorRole: 'system', actorName: 'provisionAdmin script', action: 'admin.provisioned', resourceType: 'users', resourceId: user.uid, status: 'Success', metadata: {}, timestamp: ts })
  console.log(`Admin ready: ${email} (uid ${user.uid}). Sign out/in so the new claims take effect.`)
})().catch((e) => { console.error('Failed:', e.message); process.exit(1) })
