import { collection, doc, getDoc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase.js'
import { apiError, audit, guard, nextNum } from './helpers.js'
import { createAuthUser } from './secondaryAuth.js'

const map = (d) => ({ id: d.staffId, name: d.name, email: d.email, phone: d.phone, status: d.status })
export const getStaff = async (id) => { const s = await getDoc(doc(db, 'staff', id)); return s.exists() ? map(s.data()) : null }
export const updateStaff = guard(async (id, p) => {
  const ref = doc(db, 'staff', id); const s = await getDoc(ref); if (!s.exists()) throw apiError('Profile not found.', 'NOT_FOUND')
  const b = writeBatch(db); const ts = serverTimestamp()
  b.update(ref, { name: p.name, phone: p.phone, updatedAt: ts }); b.update(doc(db, 'users', s.data().uid), { name: p.name, phone: p.phone, updatedAt: ts })
  audit(b, 'staff.updated', 'staff', id); await b.commit(); return getStaff(id)
})
// Admin only (rules). The receptionist sets their password through the reset email.
export const addStaff = guard(async (d) => {
  const email = d.email.trim().toLowerCase(); const sec = await createAuthUser(email)
  try {
    await runTransaction(db, async (tx) => {
      const cRef = doc(db, 'counters', 'staff'); const n = nextNum(await tx.get(cRef), 1); const id = `REC-${String(n).padStart(2, '0')}`; const ts = serverTimestamp()
      tx.set(cRef, { next: n + 1 })
      tx.set(doc(db, 'staff', id), { uid: sec.uid, staffId: id, name: d.name.trim(), email, phone: d.phone, role: 'receptionist', status: 'active', createdAt: ts, updatedAt: ts })
      tx.set(doc(db, 'users', sec.uid), { uid: sec.uid, name: d.name.trim(), email, phone: d.phone, role: 'receptionist', profileId: id, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
      audit(tx, 'staff.created', 'staff', id)
    })
    await sec.done(); sendPasswordResetEmail(auth, email).catch(() => {}); return null
  } catch (e) { await sec.rollback(); throw e }
})
