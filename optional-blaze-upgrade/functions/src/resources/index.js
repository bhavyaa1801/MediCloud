'use strict'
const { db, FieldValue, E, ok, handler, requireRole, v, auditSet, nextN } = require('../lib/common')

const TYPES = ['room', 'bed', 'equipment']; const STATUS = ['available', 'occupied', 'maintenance', 'unavailable']

// Validates & applies a resource change inside a transaction; rejects conflicting assignments.
async function save(actor, id, input) {
  const name = v.str(input.name, 'Name', { min: 3, max: 80 }); const type = v.oneOf(input.type, 'Type', TYPES)
  const status = v.oneOf(input.status, 'Status', STATUS); const departmentId = v.id(input.departmentId, 'departmentId')
  const assignedPatientId = status === 'occupied' && input.assignedPatientId ? v.id(input.assignedPatientId, 'assignedPatientId') : null
  const assignedAppointmentId = status === 'occupied' && input.assignedAppointmentId ? v.id(input.assignedAppointmentId, 'assignedAppointmentId') : null
  if (status !== 'occupied' && (input.assignedPatientId || input.assignedAppointmentId)) throw E('INVALID_ARGUMENT', 'Only occupied resources can have an assignment.')
  if (status === 'occupied' && type !== 'equipment' && !assignedPatientId) throw E('INVALID_ARGUMENT', 'Select the patient assigned to this resource.')
  return db.runTransaction(async (tx) => {
    const cRef = db.doc('counters/resources')
    const reads = [tx.get(db.doc(`departments/${departmentId}`)), id ? tx.get(db.doc(`resources/${id}`)) : tx.get(cRef)]
    if (assignedPatientId) reads.push(tx.get(db.doc(`patients/${assignedPatientId}`)), tx.get(db.collection('resources').where('assignedPatientId', '==', assignedPatientId)))
    const [dep, base, pat, held] = await Promise.all(reads)
    if (!dep.exists) throw E('INVALID_ARGUMENT', 'Department not found.')
    if (id && !base.exists) throw E('NOT_FOUND', 'Resource not found.')
    if (assignedPatientId) {
      if (!pat.exists) throw E('INVALID_ARGUMENT', 'Patient not found.')
      const clash = held.docs.find((x) => x.id !== id && x.data().status === 'occupied' && x.data().type !== 'equipment')
      if (type !== 'equipment' && clash) throw E('ASSIGNMENT_CONFLICT', `This patient is already assigned to ${clash.data().name}.`)
    }
    if (id && base.data().status === 'occupied' && status === 'occupied' && base.data().assignedPatientId && base.data().assignedPatientId !== assignedPatientId)
      throw E('RESOURCE_OCCUPIED', 'This resource is already assigned. Release it before reassigning.')
    const ts = FieldValue.serverTimestamp()
    const rid = id || `RES-${String(nextN(base, 1)).padStart(2, '0')}`
    const data = { resourceId: rid, name, type, departmentId, departmentName: dep.data().name, status, assignedPatientId, assignedAppointmentId, assignedPatientName: assignedPatientId ? pat.data().name : null, updatedAt: ts }
    if (id) tx.update(db.doc(`resources/${rid}`), data)
    else { tx.set(cRef, { next: nextN(base, 1) + 1 }); tx.set(db.doc(`resources/${rid}`), { ...data, createdAt: ts }) }
    auditSet(tx, actor, id ? 'resource.updated' : 'resource.created', 'resources', rid)
    return rid
  })
}

exports.addResource = handler(async (req) => { const a = await requireRole(req, 'admin'); return ok({ resourceId: await save(a, null, req.data || {}) }, 'Resource added.') })
exports.updateResource = handler(async (req) => {
  const a = await requireRole(req, 'admin'); const id = v.id(req.data?.resourceId, 'resourceId')
  const cur = await db.doc(`resources/${id}`).get(); if (!cur.exists) throw E('NOT_FOUND', 'Resource not found.')
  const merged = { ...cur.data(), ...(req.data?.patch || {}) }
  if (merged.status !== 'occupied') { merged.assignedPatientId = null; merged.assignedAppointmentId = null }
  await save(a, id, merged); return ok({}, 'Resource updated.')
})
exports.assignResource = handler(async (req) => {
  const a = await requireRole(req, 'admin'); const id = v.id(req.data?.resourceId, 'resourceId')
  const cur = await db.doc(`resources/${id}`).get(); if (!cur.exists) throw E('NOT_FOUND', 'Resource not found.')
  if (cur.data().status !== 'available') throw E('RESOURCE_OCCUPIED', 'This resource is not available.')
  await save(a, id, { ...cur.data(), status: 'occupied', assignedPatientId: req.data?.patientId, assignedAppointmentId: req.data?.appointmentId }); return ok({}, 'Resource assigned.')
})
exports.releaseResource = handler(async (req) => {
  const a = await requireRole(req, 'admin'); const id = v.id(req.data?.resourceId, 'resourceId')
  const cur = await db.doc(`resources/${id}`).get(); if (!cur.exists) throw E('NOT_FOUND', 'Resource not found.')
  await save(a, id, { ...cur.data(), status: 'available', assignedPatientId: null, assignedAppointmentId: null }); return ok({}, 'Resource released.')
})
exports.deleteResource = handler(async (req) => {
  const a = await requireRole(req, 'admin'); const id = v.id(req.data?.resourceId, 'resourceId'); const ref = db.doc(`resources/${id}`)
  const cur = await ref.get(); if (!cur.exists) throw E('NOT_FOUND', 'Resource not found.')
  if (cur.data().status === 'occupied') throw E('RESOURCE_OCCUPIED', 'Release the resource before deleting it.')
  const b = db.batch(); b.delete(ref); auditSet(b, a, 'resource.deleted', 'resources', id); await b.commit(); return ok({}, 'Resource deleted.')
})
