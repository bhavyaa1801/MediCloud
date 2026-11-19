import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'

// Role-scoped listeners (each query satisfies the rules). First snapshot skipped; later changes trigger a quiet refetch.
function scopeFor(kind, user) {
  const admin = user.role === 'admin'; const f = user.role === 'patient' ? 'patientId' : 'doctorId'
  const own = (field) => (admin || (user.role === 'receptionist' && kind === 'appointments') ? [] : [where(field, '==', user.profileId)])
  switch (kind) {
    case 'appointments': return user.role === 'receptionist' || admin || user.role === 'patient' || user.role === 'doctor' ? query(collection(db, 'appointments'), ...own(f)) : null
    case 'records': return user.role === 'receptionist' ? null : query(collection(db, 'medicalRecords'), ...own(f))
    case 'prescriptions': return user.role === 'receptionist' ? null : query(collection(db, 'prescriptions'), ...own(f))
    case 'notifications': return query(collection(db, 'notifications'), where('userId', '==', user.userId))
    case 'resources': return admin ? collection(db, 'resources') : null
    case 'doctors': return collection(db, 'doctors')
    default: return null
  }
}
export function watch(kind, user, onChange) {
  const q = user && scopeFor(kind, user)
  if (!q) return () => {}
  let first = true, t
  const off = onSnapshot(q, () => { if (first) { first = false; return } clearTimeout(t); t = setTimeout(onChange, 250) }, (e) => console.warn(`Realtime ${kind} stopped:`, e.code))
  return () => { clearTimeout(t); off() }
}
