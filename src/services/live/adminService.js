import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { apiError, audit, guard } from './helpers.js'
import { getSession } from './session.js'
import { auditFromDoc, iso } from './mappers.js'

export const getUsers = async () => (await getDocs(collection(db, 'users'))).docs.map((d) => { const u = d.data(); return { id: u.uid, profileId: u.profileId, name: u.name, email: u.email, role: u.role, status: u.status } })
const PROFILE = { patient: 'patients', doctor: 'doctors', receptionist: 'staff' }
export const updateUser = guard(async (id, patch) => {
  const ref = doc(db, 'users', id); const s = await getDoc(ref); if (!s.exists()) throw apiError('User not found.', 'NOT_FOUND')
  if (id === getSession().userId) throw apiError('You cannot change your own role or status.', 'PERMISSION_DENIED')
  const u = s.data(); const b = writeBatch(db); const ts = serverTimestamp()
  if (patch.role) {
    if (u.role === 'doctor' || u.role === 'receptionist') throw apiError('Doctor and receptionist accounts are managed from their own pages.', 'INVALID_ARGUMENT')
    b.update(ref, { role: patch.role, updatedAt: ts }); audit(b, 'user.role_changed', 'users', id, { role: patch.role })
  }
  if (patch.status) {
    b.update(ref, { status: patch.status, updatedAt: ts })
    if (PROFILE[u.role]) b.update(doc(db, PROFILE[u.role], u.profileId), { status: patch.status, updatedAt: ts })
    audit(b, 'user.status_changed', 'users', id, { status: patch.status })
  }
  await b.commit(); return null
})
export const getAuditLogs = async () => (await getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(200)))).docs.map((d) => auditFromDoc(d.data(), d.id))
export const getSettings = async () => { const s = await getDoc(doc(db, 'settings', 'hospital')); return s.exists() ? s.data() : { hospitalName: 'MediCloud Hospital', email: '', phone: '', address: '', onlineBooking: true, emailAlerts: true, cancelWindowHours: 2 } }
export const saveSettings = guard(async (s) => { const b = writeBatch(db); b.set(doc(db, 'settings', 'hospital'), s); audit(b, 'settings.updated', 'settings', 'hospital'); await b.commit(); return s })

// Manual backup (free plan has no scheduled exports). Downloads all main collections as JSON (record files excluded).
export const exportData = guard(async () => {
  const out = {}
  for (const c of ['users', 'patients', 'doctors', 'staff', 'departments', 'appointments', 'medicalRecords', 'prescriptions', 'resources', 'settings', 'auditLogs']) out[c] = (await getDocs(collection(db, c))).docs.map((d) => ({ _id: d.id, ...d.data() }))
  const blob = new Blob([JSON.stringify(out, (k, v) => (v?.toDate ? iso(v) : v), 2)], { type: 'application/json' })
  const name = `MediCloud-backup-${new Date().toISOString().slice(0, 10)}.json`
  Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name }).click()
  return { fileName: name }
})
