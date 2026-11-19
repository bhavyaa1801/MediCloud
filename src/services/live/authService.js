import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { audit, nextNum } from './helpers.js'
import { setSession } from './session.js'

let registering = false
const friendly = (e) => {
  const c = e?.code || ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(c)) return new Error('Invalid email or password.')
  if (c === 'auth/too-many-requests') return new Error('Too many attempts. Please wait and try again.')
  if (c === 'auth/user-disabled') return new Error('This account has been deactivated. Contact the hospital.')
  if (c === 'auth/email-already-in-use') return new Error('An account with this email already exists.')
  if (c === 'auth/weak-password') return new Error('Password is too weak. Use at least 8 characters.')
  if (c === 'auth/network-request-failed') return new Error('Network error. Check your connection and try again.')
  if (c === 'permission-denied') return new Error('Registration was blocked. Please try again.')
  return e?.message && !c ? e : new Error('Something went wrong. Please try again.')
}

// The role is read from users/{uid}, which clients cannot edit (see firestore.rules).
async function buildSession(fbUser) {
  const snap = await getDoc(doc(db, 'users', fbUser.uid))
  if (!snap.exists()) return null
  const u = snap.data()
  if (u.status !== 'active') { await signOut(auth); return null }
  const s = { userId: fbUser.uid, profileId: u.profileId, role: u.role, name: u.name, email: u.email }
  setSession(s)
  return s
}

export function init(cb) {
  return onAuthStateChanged(auth, async (u) => {
    if (registering) return
    if (!u) { setSession(null); return cb(null) }
    try { cb(await buildSession(u)) } catch { cb(null) }
  })
}
export async function login(email, password) {
  try {
    const c = await signInWithEmailAndPassword(auth, email.trim(), password)
    const s = await buildSession(c.user)
    if (!s) { await signOut(auth); throw new Error('This account is not active or has no profile. Contact the hospital.') }
    const b = writeBatch(db); audit(b, 'auth.login', 'users', s.userId); b.commit().catch(() => {})
    return s
  } catch (e) { throw friendly(e) }
}
export const loginAs = async () => { throw new Error('Demo login is only available in mock mode.') }

// Public self-registration: ALWAYS creates a patient (enforced again by the rules).
export async function registerPatient(d) {
  registering = true
  let cred
  try {
    cred = await createUserWithEmailAndPassword(auth, d.email.trim(), d.password)
    const uid = cred.user.uid; const email = cred.user.email.toLowerCase()
    await runTransaction(db, async (tx) => {
      const cRef = doc(db, 'counters', 'patients'); const n = nextNum(await tx.get(cRef), 1001); const id = `PT-${n}`
      const base = { name: d.name.trim(), email, phone: d.phone }; const ts = serverTimestamp()
      tx.set(cRef, { next: n + 1 })
      tx.set(doc(db, 'patients', id), { uid, patientId: id, ...base, dateOfBirth: d.dob, gender: d.gender, bloodGroup: '', address: '', emergencyContact: '', status: 'active', createdAt: ts, updatedAt: ts })
      tx.set(doc(db, 'users', uid), { uid, ...base, role: 'patient', profileId: id, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
    })
    return await buildSession(cred.user)
  } catch (e) { if (cred) await cred.user.delete().catch(() => {}); throw friendly(e) } finally { registering = false }
}
export const logout = () => { setSession(null); return signOut(auth) }
export const sendReset = async (email) => { try { await sendPasswordResetEmail(auth, email.trim()) } catch (e) { if (e?.code === 'auth/network-request-failed') throw friendly(e) } } // never reveal whether an email exists
export const saveSession = () => {}
