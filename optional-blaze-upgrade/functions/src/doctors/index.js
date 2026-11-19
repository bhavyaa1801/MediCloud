'use strict'
const { admin, db, FieldValue, E, ok, handler, requireRole, v, auditSet, notifySet, nextN } = require('../lib/common')
const { provision } = require('../lib/provision')

const uiToDoc = (d) => ({
  workingHours: { start: d.start, end: d.end, breakStart: d.breakStart, breakEnd: d.breakEnd },
  availability: { workingDays: d.workingDays, slotMinutes: d.slotMinutes, blockedDates: d.blockedDates },
})
function checkHours(h) {
  const t = (x) => parseInt(x.slice(0, 2), 10) * 60 + parseInt(x.slice(3), 10)
  if (t(h.start) >= t(h.end)) throw E('INVALID_ARGUMENT', 'End time must be after start time.')
  if (h.breakStart && h.breakEnd && (t(h.breakStart) >= t(h.breakEnd) || t(h.breakStart) < t(h.start) || t(h.breakEnd) > t(h.end))) throw E('INVALID_ARGUMENT', 'Break must fall within working hours.')
}
async function deptName(id) { const s = await db.doc(`departments/${id}`).get(); if (!s.exists || s.data().status === 'inactive') throw E('INVALID_ARGUMENT', 'Department not found.'); return s.data().name }

function profileFields(d, partial = false) {
  const out = {}
  const set = (k, fn) => { if (!partial || d[k] !== undefined) out[k] = fn() }
  set('name', () => v.str(d.name, 'Name', { min: 5, max: 80 })); set('phone', () => v.phone(d.phone))
  set('specialization', () => v.str(d.specialization, 'Specialization', { max: 80 })); set('qualifications', () => v.str(d.qualifications, 'Qualifications', { max: 150 }))
  set('experience', () => v.num(d.experience, 'Experience', { max: 60 })); set('consultationFee', () => v.num(d.consultationFee, 'Consultation fee', { min: 1, max: 100000 }))
  if (d.bio !== undefined) out.bio = v.str(d.bio, 'About', { min: 0, max: 600 })
  return out
}

exports.createDoctor = handler(async (req) => {
  const actor = await requireRole(req, 'admin'); const d = req.data || {}
  const f = profileFields(d); const email = v.email(d.email)
  const departmentId = v.id(d.departmentId, 'departmentId'); const departmentName = await deptName(departmentId)
  const sched = { start: v.time(d.start, 'Start time'), end: v.time(d.end, 'End time'), breakStart: d.breakStart ? v.time(d.breakStart, 'Break start') : '13:00', breakEnd: d.breakEnd ? v.time(d.breakEnd, 'Break end') : '14:00', workingDays: v.days(d.workingDays), slotMinutes: [15, 20, 30, 45, 60].includes(d.slotMinutes) ? d.slotMinutes : 30, blockedDates: [] }
  checkHours(sched)
  const { name, phone, ...rest } = f
  const { uid, profileId } = await provision({ actor, role: 'doctor', email, name, phone, profile: { ...rest, bio: rest.bio || '', departmentId, departmentName, ...uiToDoc(sched) } })
  return ok({ doctorId: profileId, uid }, 'Doctor added. Send them a password-reset email to activate the account.')
})

exports.updateDoctor = handler(async (req) => {
  const actor = await requireRole(req, 'admin', 'doctor'); const d = req.data || {}
  const doctorId = actor.role === 'doctor' ? actor.profileId : v.id(d.doctorId, 'doctorId')
  if (actor.role === 'doctor' && d.doctorId && d.doctorId !== actor.profileId) throw E('PERMISSION_DENIED', 'You can only edit your own profile.')
  const patch = profileFields(d.patch || {}, true)       // role/status/uid are never accepted here
  if (actor.role === 'admin' && d.patch?.departmentId) { patch.departmentId = v.id(d.patch.departmentId, 'departmentId'); patch.departmentName = await deptName(patch.departmentId) }
  const ref = db.doc(`doctors/${doctorId}`); const snap = await ref.get()
  if (!snap.exists) throw E('NOT_FOUND', 'Doctor not found.')
  const uid = snap.data().uid
  if (d.patch?.email !== undefined) {
    const email = v.email(d.patch.email)
    if (email !== snap.data().email) {
      try { await admin.auth().updateUser(uid, { email }) } catch (e) { throw E('EMAIL_EXISTS', 'That email cannot be used.') }
      patch.email = email
    }
  }
  const ts = FieldValue.serverTimestamp(); const b = db.batch()
  b.update(ref, { ...patch, updatedAt: ts })
  const u = {}; ['name', 'email', 'phone'].forEach((k) => { if (patch[k] !== undefined) u[k] = patch[k] })
  if (Object.keys(u).length) b.update(db.doc(`users/${uid}`), { ...u, updatedAt: ts })
  auditSet(b, actor, 'doctor.updated', 'doctors', doctorId)
  await b.commit()
  return ok({}, 'Doctor updated.')
})

exports.updateDoctorAvailability = handler(async (req) => {
  const actor = await requireRole(req, 'admin', 'doctor'); const d = req.data || {}
  const doctorId = actor.role === 'doctor' ? actor.profileId : v.id(d.doctorId, 'doctorId')
  const sched = {
    start: v.time(d.start, 'Start time'), end: v.time(d.end, 'End time'), breakStart: d.breakStart ? v.time(d.breakStart, 'Break start') : '', breakEnd: d.breakEnd ? v.time(d.breakEnd, 'Break end') : '',
    workingDays: v.days(d.workingDays), slotMinutes: v.oneOf(d.slotMinutes, 'Appointment duration', [15, 20, 30, 45, 60]),
    blockedDates: (Array.isArray(d.blockedDates) ? d.blockedDates : []).slice(0, 200).map((x) => v.date(x, 'Blocked date')),
  }
  checkHours(sched)
  const ref = db.doc(`doctors/${doctorId}`)
  let affected = []
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw E('NOT_FOUND', 'Doctor not found.')
    const old = snap.data()
    const newly = sched.blockedDates.filter((x) => !(old.availability.blockedDates || []).includes(x))
    // Patients with active bookings on newly blocked dates are notified (bookings are not auto-cancelled).
    const appts = await tx.get(db.collection('appointments').where('doctorId', '==', doctorId).where('status', 'in', ['pending', 'confirmed']))
    affected = appts.docs.map((x) => x.data()).filter((a) => newly.includes(a.date))
    tx.update(ref, { ...uiToDoc(sched), updatedAt: FieldValue.serverTimestamp() })
    affected.forEach((a) => notifySet(tx, a.patientUid, { title: 'Doctor availability changed', message: `${old.name} is unavailable on ${a.date}. Please reschedule or contact the hospital.`, type: 'availability', key: `blocked-${a.appointmentId}-${a.date}` }))
    auditSet(tx, actor, 'doctor.availability_updated', 'doctors', doctorId)
  })
  return ok({ affectedAppointments: affected.length }, 'Schedule updated.')
})

exports.setDoctorStatus = handler(async (req) => {
  const actor = await requireRole(req, 'admin')
  const doctorId = v.id(req.data?.doctorId, 'doctorId'); const status = v.oneOf(req.data?.status, 'Status', ['active', 'inactive'])
  const ref = db.doc(`doctors/${doctorId}`); const snap = await ref.get()
  if (!snap.exists) throw E('NOT_FOUND', 'Doctor not found.')
  const uid = snap.data().uid; const b = db.batch(); const ts = FieldValue.serverTimestamp()
  b.update(ref, { status, updatedAt: ts }); b.update(db.doc(`users/${uid}`), { status, updatedAt: ts })
  auditSet(b, actor, status === 'inactive' ? 'doctor.deactivated' : 'doctor.activated', 'doctors', doctorId)
  await b.commit()
  await admin.auth().updateUser(uid, { disabled: status === 'inactive' })
  if (status === 'inactive') await admin.auth().revokeRefreshTokens(uid)
  return ok({}, `Doctor ${status}.`)
})

exports.createDepartment = handler(async (req) => {
  const actor = await requireRole(req, 'admin')
  const name = v.str(req.data?.name, 'Name', { min: 3, max: 80 }); const description = v.str(req.data?.description, 'Description', { max: 300 }); const head = v.str(req.data?.head, 'Head', { min: 0, max: 80 })
  const id = await db.runTransaction(async (tx) => {
    const cRef = db.doc('counters/departments'); const [c, dup] = await Promise.all([tx.get(cRef), tx.get(db.collection('departments').where('name', '==', name))])
    if (!dup.empty) throw E('DUPLICATE', 'A department with this name already exists.')
    const n = nextN(c, 1); const id = `DEP-${n}`
    tx.set(cRef, { next: n + 1 }); tx.set(db.doc(`departments/${id}`), { departmentId: id, name, description, head, status: 'active', createdAt: FieldValue.serverTimestamp() })
    auditSet(tx, actor, 'department.created', 'departments', id)
    return id
  })
  return ok({ departmentId: id }, 'Department added.')
})
exports.updateDepartment = handler(async (req) => {
  const actor = await requireRole(req, 'admin'); const id = v.id(req.data?.departmentId, 'departmentId'); const p = req.data?.patch || {}
  const patch = { name: v.str(p.name, 'Name', { min: 3, max: 80 }), description: v.str(p.description, 'Description', { max: 300 }), head: v.str(p.head, 'Head', { min: 0, max: 80 }) }
  const ref = db.doc(`departments/${id}`)
  if (!(await ref.get()).exists) throw E('NOT_FOUND', 'Department not found.')
  const b = db.batch(); b.update(ref, patch)
  const docs = await db.collection('doctors').where('departmentId', '==', id).get()
  docs.forEach((d) => b.update(d.ref, { departmentName: patch.name }))
  auditSet(b, actor, 'department.updated', 'departments', id); await b.commit()
  return ok({}, 'Department updated.')
})
