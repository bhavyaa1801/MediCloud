import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { apiError, audit, guard, nextNum } from './helpers.js'
import { resourceFromDoc, typeToApi } from './mappers.js'

export const getResources = async () => (await getDocs(collection(db, 'resources'))).docs.map((d) => resourceFromDoc(d.data())).sort((a, b) => a.id.localeCompare(b.id))

// Business rules (no double-assignment) are enforced here in a transaction; rules restrict WHO may write (admin only).
async function save(id, input) {
  const type = typeToApi(input.type)
  if (!['room', 'bed', 'equipment'].includes(type)) throw apiError('Invalid resource type.', 'INVALID_ARGUMENT')
  if (!input.name || input.name.trim().length < 3) throw apiError('Enter a resource name.', 'INVALID_ARGUMENT')
  const status = input.status; const pid = status === 'occupied' ? input.assignedTo || null : null
  if (status !== 'occupied' && input.assignedTo) throw apiError('Only occupied resources can have an assigned patient.', 'INVALID_ARGUMENT')
  if (status === 'occupied' && type !== 'equipment' && !pid) throw apiError('Select the patient assigned to this occupied resource.', 'INVALID_ARGUMENT')
  const held = pid && type !== 'equipment' ? (await getDocs(query(collection(db, 'resources'), where('assignedPatientId', '==', pid)))).docs.find((x) => x.id !== id && x.data().status === 'occupied' && x.data().type !== 'equipment') : null
  if (held) throw apiError(`This patient is already assigned to ${held.data().name}.`, 'ASSIGNMENT_CONFLICT')
  return runTransaction(db, async (tx) => {
    const cRef = doc(db, 'counters', 'resources')
    const [dep, base, pat] = await Promise.all([tx.get(doc(db, 'departments', input.departmentId)), id ? tx.get(doc(db, 'resources', id)) : tx.get(cRef), pid ? tx.get(doc(db, 'patients', pid)) : Promise.resolve(null)])
    if (!dep.exists()) throw apiError('Department not found.', 'INVALID_ARGUMENT')
    if (id && !base.exists()) throw apiError('Resource not found.', 'NOT_FOUND')
    if (pid && !pat.exists()) throw apiError('Patient not found.', 'INVALID_ARGUMENT')
    if (id && base.data().status === 'occupied' && status === 'occupied' && base.data().assignedPatientId && base.data().assignedPatientId !== pid) throw apiError('This resource is already assigned. Release it before reassigning.', 'RESOURCE_OCCUPIED')
    const rid = id || `RES-${String(nextNum(base, 1)).padStart(2, '0')}`; const ts = serverTimestamp()
    const data = { resourceId: rid, name: input.name.trim(), type, departmentId: input.departmentId, departmentName: dep.data().name, status, assignedPatientId: pid, assignedAppointmentId: null, assignedPatientName: pid ? pat.data().name : null, updatedAt: ts }
    if (id) tx.set(doc(db, 'resources', rid), { ...base.data(), ...data })
    else { tx.set(cRef, { next: nextNum(base, 1) + 1 }); tx.set(doc(db, 'resources', rid), { ...data, createdAt: ts }) }
    audit(tx, id ? 'resource.updated' : 'resource.created', 'resources', rid)
    return null
  })
}
export const addResource = guard((d) => save(null, { ...d, status: d.status || 'available' }))
export const updateResource = guard(async (id, patch) => {
  const cur = await getDoc(doc(db, 'resources', id)); if (!cur.exists()) throw apiError('Resource not found.', 'NOT_FOUND')
  const c = resourceFromDoc(cur.data())
  const m = { name: c.name, type: c.type, departmentId: c.departmentId, status: c.status, assignedTo: c.assignedTo, ...patch }
  if (m.status !== 'occupied') m.assignedTo = null
  return save(id, m)
})
