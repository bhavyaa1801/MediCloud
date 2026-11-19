import { getApps, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { apiError } from './helpers.js'

const randomPassword = () => { const b = new Uint8Array(18); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/[^A-Za-z0-9]/g, 'x') + 'aA1!' }

// Creates an Auth account for ANOTHER person without logging the current admin/receptionist out
// (uses a second Firebase app instance). The person later sets their own password via a reset email.
export async function createAuthUser(email) {
  const app2 = getApps().find((a) => a.name === 'secondary') || initializeApp(auth.app.options, 'secondary')
  const a2 = getAuth(app2)
  let cred
  try { cred = await createUserWithEmailAndPassword(a2, email, randomPassword()) } catch (e) {
    if (e.code === 'auth/email-already-in-use') throw apiError('An account with this email already exists.', 'EMAIL_EXISTS')
    if (e.code === 'auth/invalid-email') throw apiError('Enter a valid email address.', 'INVALID_ARGUMENT')
    throw e
  }
  return { uid: cred.user.uid, done: () => signOut(a2), rollback: async () => { await cred.user.delete().catch(() => {}); await signOut(a2).catch(() => {}) } }
}
