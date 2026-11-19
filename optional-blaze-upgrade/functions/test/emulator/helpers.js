// Emulator integration helpers. Run via: npm run test:emulator (firebase emulators:exec).
const admin = require('firebase-admin')
const PROJECT = process.env.GCLOUD_PROJECT || 'demo-medicloud'
const REGION = process.env.FUNCTIONS_REGION || 'asia-south1'
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` })
const db = admin.firestore()
const AUTH = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts`

async function signUp(email, password = 'Passw0rd!x') {
  const r = await (await fetch(`${AUTH}:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).json()
  return { uid: r.localId, token: r.idToken }
}
async function tokenFor(email, password = 'Passw0rd!x') {
  const r = await (await fetch(`${AUTH}:signInWithPassword?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).json()
  return r.idToken
}
// Calls a callable over HTTP exactly like the client SDK does; returns the unwrapped envelope.
async function call(name, data = {}, token) {
  const res = await fetch(`http://127.0.0.1:5001/${PROJECT}/${REGION}/${name}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ data }) })
  const j = await res.json()
  return j.result ?? { success: false, error: { code: 'HTTP_' + (j.error?.status || res.status), message: j.error?.message } }
}
// Trusted provisioning (what scripts/functions do server-side) for doctors/admins in tests.
async function provision(role, email, profileId, extra = {}) {
  const u = await admin.auth().createUser({ email, password: 'Passw0rd!x' })
  await admin.auth().setCustomUserClaims(u.uid, { role, profileId })
  await db.doc(`users/${u.uid}`).set({ uid: u.uid, name: extra.name || email, email, phone: '', role, profileId, status: 'active' })
  return { uid: u.uid, token: await tokenFor(email) }
}
async function registerPatient(email, name = 'Test Patient') {
  const { token } = await signUp(email)
  const r = await call('completePatientRegistration', { name, phone: '+91 90000 00000', dateOfBirth: '1990-01-01', gender: 'Male' }, token)
  return { ...r, token: await tokenFor(email) }   // re-login so the token carries claims
}
async function seedDoctor(id, email, uidTokenName) {
  const d = await provision('doctor', email, id, { name: uidTokenName || 'Dr. Test' })
  await db.doc('departments/DEP-1').set({ departmentId: 'DEP-1', name: 'General Medicine', status: 'active' })
  await db.doc(`doctors/${id}`).set({ uid: d.uid, doctorId: id, name: uidTokenName || 'Dr. Test', specialization: 'GP', departmentId: 'DEP-1', departmentName: 'General Medicine', consultationFee: 500, status: 'active', workingHours: { start: '09:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' }, availability: { workingDays: [0, 1, 2, 3, 4, 5, 6], slotMinutes: 30, blockedDates: [] } })
  return d
}
const dayPlus = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10) }
const uniq = () => Math.random().toString(36).slice(2, 8)
module.exports = { admin, db, call, signUp, tokenFor, provision, registerPatient, seedDoctor, dayPlus, uniq, PROJECT }
