import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase.js'
import { apiError, audit, guard, nextNum, notify } from './helpers.js'
import { createAuthUser } from './secondaryAuth.js'
import { doctorFromDoc } from './mappers.js'

export const getDoctors = async () => (await getDocs(collection(db, 'doctors'))).docs.map((d) => doctorFromDoc(d.data()))
export const getDoctor = async (id) => { const s = await getDoc(doc(db, 'doctors', id)); return s.exists() ? doctorFromDoc(s.data()) : null }
export async function getDepartments() {
  const [deps, docs] = await Promise.all([getDocs(collection(db, 'departments')), getDoctors()])
  return deps.docs.map((d) => d.data()).filter((d) => d.status !== 'inactive').sort((a, b) => a.departmentId.localeCompare(b.departmentId, undefined, { numeric: true }))
    .map((d) => ({ id: d.departmentId, name: d.name, description: d.description, head: d.head, doctorCount: docs.filter((x) => x.departmentId === d.departmentId).length }))
}

// Admin only (enforced by rules). The new doctor gets a reset email to choose their own password.
export const addDoctor = guard(async (d) => {
  const email = d.email.trim().toLowerCase()
  const dep = await getDoc(doc(db, 'departments', d.departmentId)); if (!dep.exists()) throw apiError('Department not found.', 'INVALID_ARGUMENT')
  const sec = await createAuthUser(email)
  try {
    const id = await runTransaction(db, async (tx) => {
      const cRef = doc(db, 'counters', 'doctors'); const n = nextNum(await tx.get(cRef), 1); const id = `DOC-${String(n).padStart(2, '0')}`; const ts = serverTimestamp()
      tx.set(cRef, { next: n + 1 })
      tx.set(doc(db, 'doctors', id), { uid: sec.uid, doctorId: id, name: d.name.trim(), email, phone: d.phone, specialization: d.specialization.trim(), departmentId: d.departmentId, departmentName: dep.data().name, qualifications: d.qualifications.trim(), experience: d.experience, consultationFee: d.fee, bio: '', workingHours: { start: d.start, end: d.end, breakStart: '13:00', breakEnd: '14:00' }, availability: { workingDays: d.workingDays, slotMinutes: 30, blockedDates: [] }, status: 'active', createdAt: ts, updatedAt: ts })
      tx.set(doc(db, 'users', sec.uid), { uid: sec.uid, name: d.name.trim(), email, phone: d.phone, role: 'doctor', profileId: id, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
      audit(tx, 'doctor.created', 'doctors', id)
      return id
    })
    await sec.done()
    sendPasswordResetEmail(auth, email).catch(() => {})
    return getDoctor(id)
  } catch (e) { await sec.rollback(); throw e }
})

const AVAIL = ['workingDays', 'start', 'end', 'breakStart', 'breakEnd', 'slotMinutes', 'blockedDates']
export const updateDoctor = guard(async (id, patch) => {
  const cur = await getDoctor(id); if (!cur) throw apiError('Doctor not found.', 'NOT_FOUND')
  const ref = doc(db, 'doctors', id); const raw = (await getDoc(ref)).data()
  const changed = (k) => patch[k] !== undefined && JSON.stringify(patch[k]) !== JSON.stringify(cur[k])
  const upd = { updatedAt: serverTimestamp() }; const userUpd = {}
  ;['name', 'phone', 'specialization', 'qualifications', 'experience', 'bio'].forEach((k) => { if (changed(k)) { upd[k] = patch[k]; if (k === 'name' || k === 'phone') userUpd[k] = patch[k] } })
  if (changed('fee')) upd.consultationFee = patch.fee
  if (changed('departmentId')) { const dep = await getDoc(doc(db, 'departments', patch.departmentId)); if (!dep.exists()) throw apiError('Department not found.', 'INVALID_ARGUMENT'); upd.departmentId = patch.departmentId; upd.departmentName = dep.data().name }
  const m = { ...cur, ...patch }
  const newlyBlocked = AVAIL.some(changed) ? (m.blockedDates || []).filter((x) => !(cur.blockedDates || []).includes(x)) : []
  if (AVAIL.some(changed)) {
    upd.workingHours = { start: m.start, end: m.end, breakStart: m.breakStart, breakEnd: m.breakEnd }
    upd.availability = { workingDays: m.workingDays, slotMinutes: Number(m.slotMinutes), blockedDates: m.blockedDates }
  }
  const statusChanged = changed('status')
  if (statusChanged) upd.status = patch.status
  const affected = newlyBlocked.length ? (await getDocs(query(collection(db, 'appointments'), where('doctorId', '==', id)))).docs.map((x) => x.data()).filter((a) => ['pending', 'confirmed'].includes(a.status) && newlyBlocked.includes(a.date)) : []
  const b = writeBatch(db)
  b.update(ref, upd)
  if (statusChanged) userUpd.status = patch.status
  if (Object.keys(userUpd).length) b.update(doc(db, 'users', raw.uid), { ...userUpd, updatedAt: serverTimestamp() })
  affected.forEach((a) => notify(b, a.patientUid, { title: 'Doctor availability changed', message: `${cur.name} is unavailable on ${a.date}. Please reschedule or contact reception.`, type: 'availability', key: `blocked-${a.appointmentId}-${a.date}` }))
  audit(b, statusChanged ? `doctor.${patch.status === 'inactive' ? 'deactivated' : 'activated'}` : 'doctor.updated', 'doctors', id)
  await b.commit()
  return getDoctor(id)
})

export const addDepartment = guard(async (d) => {
  const all = await getDocs(collection(db, 'departments'))
  if (all.docs.some((x) => x.data().name.toLowerCase() === d.name.trim().toLowerCase())) throw apiError('A department with this name already exists.', 'DUPLICATE')
  return runTransaction(db, async (tx) => {
    const cRef = doc(db, 'counters', 'departments'); const n = nextNum(await tx.get(cRef), 1); const id = `DEP-${n}`
    tx.set(cRef, { next: n + 1 })
    tx.set(doc(db, 'departments', id), { departmentId: id, name: d.name.trim(), description: d.description, head: d.head || '', status: 'active', createdAt: serverTimestamp() })
    audit(tx, 'department.created', 'departments', id)
    return { id }
  })
})
export const updateDepartment = guard(async (id, p) => {
  const b = writeBatch(db)
  b.update(doc(db, 'departments', id), { name: p.name.trim(), description: p.description, head: p.head || '' })
  ;(await getDocs(query(collection(db, 'doctors'), where('departmentId', '==', id)))).forEach((d) => b.update(d.ref, { departmentName: p.name.trim() }))
  audit(b, 'department.updated', 'departments', id)
  await b.commit(); return null
})
