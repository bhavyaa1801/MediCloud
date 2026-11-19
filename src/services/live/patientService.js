import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase.js'
import { apiError, audit, guard, nextNum } from './helpers.js'
import { createAuthUser } from './secondaryAuth.js'
import { getSession } from './session.js'
import { patientFromDoc } from './mappers.js'

export const getPatients = async () => (await getDocs(collection(db, 'patients'))).docs.map((d) => patientFromDoc(d.data()))
export const getPatient = async (id) => { try { const s = await getDoc(doc(db, 'patients', id)); return s.exists() ? patientFromDoc(s.data()) : null } catch { return null } }
export async function getDoctorPatients(doctorId) {
  const ids = [...new Set((await getDocs(query(collection(db, 'appointments'), where('doctorId', '==', doctorId)))).docs.map((d) => d.data().patientId))]
  return (await Promise.all(ids.map(getPatient))).filter(Boolean)
}

// Admin or receptionist registers a patient; the patient then sets their own password via the reset email.
export const addPatient = guard(async (d) => {
  const email = d.email.trim().toLowerCase(); const sec = await createAuthUser(email)
  try {
    await runTransaction(db, async (tx) => {
      const cRef = doc(db, 'counters', 'patients'); const n = nextNum(await tx.get(cRef), 1001); const id = `PT-${n}`; const ts = serverTimestamp()
      const base = { name: d.name.trim(), email, phone: d.phone }
      tx.set(cRef, { next: n + 1 })
      tx.set(doc(db, 'patients', id), { uid: sec.uid, patientId: id, ...base, dateOfBirth: d.dob, gender: d.gender, bloodGroup: '', address: '', emergencyContact: '', status: 'active', createdAt: ts, updatedAt: ts })
      tx.set(doc(db, 'users', sec.uid), { uid: sec.uid, ...base, role: 'patient', profileId: id, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
      audit(tx, 'patient.created', 'patients', id)
    })
    await sec.done(); sendPasswordResetEmail(auth, email).catch(() => {}); return null
  } catch (e) { await sec.rollback(); throw e }
})

export const updatePatient = guard(async (id, p) => {
  const ref = doc(db, 'patients', id); const s = await getDoc(ref); if (!s.exists()) throw apiError('Patient not found.', 'NOT_FOUND')
  const me = getSession(); const b = writeBatch(db); const ts = serverTimestamp()
  if (p.status) {
    if (me.role !== 'admin') throw apiError('Only an administrator can change account status.', 'PERMISSION_DENIED')
    b.update(ref, { status: p.status, updatedAt: ts }); b.update(doc(db, 'users', s.data().uid), { status: p.status, updatedAt: ts })
    audit(b, `patient.${p.status === 'inactive' ? 'deactivated' : 'activated'}`, 'patients', id)
  } else {
    const map = { name: p.name, phone: p.phone, dateOfBirth: p.dob, gender: p.gender, bloodGroup: p.bloodGroup, address: p.address, emergencyContact: p.emergencyContact }
    const upd = { updatedAt: ts }; Object.entries(map).forEach(([k, v]) => { if (v !== undefined && v !== s.data()[k]) upd[k] = v })
    b.update(ref, upd)
    const u = {}; ;['name', 'phone'].forEach((k) => { if (upd[k] !== undefined) u[k] = upd[k] })
    if (Object.keys(u).length) b.update(doc(db, 'users', s.data().uid), { ...u, updatedAt: ts })
    audit(b, 'patient.updated', 'patients', id)
  }
  await b.commit(); return getPatient(id)
})
