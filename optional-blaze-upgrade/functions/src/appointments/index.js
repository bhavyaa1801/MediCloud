'use strict'
const { db, FieldValue, E, ok, handler, requireRole, v, auditSet, notifySet, rateLimit, nextN } = require('../lib/common')
const { buildSlots, isWorkingDate, slotEnd, slotId, minutesUntil, nowLocal } = require('../lib/slots')

const ACTIVE = ['pending', 'confirmed']
const TRANSITIONS = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled', 'no_show'], completed: [], cancelled: [], no_show: [] }
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

// Returns slot times with booked flags. Only times are exposed (no patient data).
exports.getAvailableSlots = handler(async (req) => {
  await requireRole(req)
  const doctorId = v.id(req.data?.doctorId, 'doctorId'); const date = v.date(req.data?.date, 'date')
  const d = await db.doc(`doctors/${doctorId}`).get()
  if (!d.exists) throw E('NOT_FOUND', 'Doctor not found.')
  const booked = new Set((await db.collection('appointmentSlots').where('doctorId', '==', doctorId).where('date', '==', date).get()).docs.map((s) => s.data().startTime))
  return ok(buildSlots(d.data(), date).map((time) => ({ time, booked: booked.has(time) })))
})

exports.bookAppointment = handler(async (req) => {
  const actor = await requireRole(req, 'patient')
  await rateLimit(actor.uid, 'book', 10, 60)
  const doctorId = v.id(req.data?.doctorId, 'doctorId'); const date = v.date(req.data?.date, 'date'); const time = v.time(req.data?.time, 'time')
  const reason = v.str(req.data?.reason, 'Reason', { min: 0, max: 500 }) || 'General consultation'

  const appt = await db.runTransaction(async (tx) => {
    const slotRef = db.doc(`appointmentSlots/${slotId(doctorId, date, time)}`)
    const cRef = db.doc('counters/appointments')
    // ALL reads first (Firestore requirement). Reading slotRef - even when absent - makes a concurrent create conflict and retry.
    const [dSnap, pSnap, sSnap, cSnap, cfg, mine] = await Promise.all([
      tx.get(db.doc(`doctors/${doctorId}`)), tx.get(db.doc(`patients/${actor.profileId}`)), tx.get(slotRef), tx.get(cRef),
      tx.get(db.doc('settings/hospital')), tx.get(db.collection('appointments').where('patientId', '==', actor.profileId).where('date', '==', date)),
    ])
    if (cfg.exists && cfg.data().onlineBooking === false) throw E('BOOKING_DISABLED', 'Online booking is currently disabled.')
    if (!dSnap.exists || dSnap.data().status !== 'active') throw E('DOCTOR_UNAVAILABLE', 'This doctor is not available.')
    if (!pSnap.exists || pSnap.data().status !== 'active') throw E('PERMISSION_DENIED', 'Your patient profile is not active.')
    const d = dSnap.data(); const p = pSnap.data()
    if (!isWorkingDate(d, date)) throw E('DOCTOR_UNAVAILABLE', 'The doctor is not available on this date.')
    if (!buildSlots(d, date).includes(time)) throw E('INVALID_SLOT', 'This time is not a valid bookable slot.')
    if (sSnap.exists && sSnap.data().status === 'booked') throw E('SLOT_UNAVAILABLE', 'This appointment slot is no longer available.')
    if (mine.docs.some((x) => x.data().startTime === time && ACTIVE.includes(x.data().status))) throw E('PATIENT_CONFLICT', 'You already have an appointment at this time.')

    const n = nextN(cSnap, 2001); const appointmentId = `APT-${n}`; const endTime = slotEnd(d, time); const ts = FieldValue.serverTimestamp()
    tx.set(cRef, { next: n + 1 })
    tx.set(slotRef, { doctorId, date, startTime: time, endTime, appointmentId, status: 'booked' })
    tx.set(db.doc(`appointments/${appointmentId}`), {
      appointmentId, patientId: actor.profileId, doctorId, departmentId: d.departmentId, patientUid: actor.uid, doctorUid: d.uid,
      patientName: p.name, doctorName: d.name, departmentName: d.departmentName || '', specialization: d.specialization,
      date, startTime: time, endTime, reason, roomId: null, fee: d.consultationFee, status: 'pending', createdAt: ts, updatedAt: ts,
    })
    tx.set(db.doc(`patients/${actor.profileId}/careTeam/${doctorId}`), { doctorId, since: ts }, { merge: true })
    notifySet(tx, actor.uid, { title: 'Appointment requested', message: `Your appointment with ${d.name} on ${date} at ${time} is pending confirmation.`, type: 'appointment', key: `booked-${appointmentId}` })
    notifySet(tx, d.uid, { title: 'New appointment booked', message: `${p.name} booked a consultation on ${date} at ${time}.`, type: 'appointment', key: `booked-${appointmentId}` })
    auditSet(tx, actor, 'appointment.booked', 'appointments', appointmentId, { doctorId, date, time })
    return { id: appointmentId, patientId: actor.profileId, doctorId, departmentId: d.departmentId, patientName: p.name, doctorName: d.name, departmentName: d.departmentName || '', specialization: d.specialization, date, time, endTime, reason, fee: d.consultationFee, status: 'Pending' }
  })
  return ok(appt, 'Appointment booked successfully.')
})

// Single authoritative status-change path (cancel, confirm, complete, no-show).
async function changeStatus(actor, appointmentId, to) {
  await db.runTransaction(async (tx) => {
    const aRef = db.doc(`appointments/${appointmentId}`)
    const aSnap = await tx.get(aRef)
    if (!aSnap.exists) throw E('NOT_FOUND', 'Appointment not found.')
    const a = aSnap.data()
    const own = (actor.role === 'patient' && a.patientId === actor.profileId) || (actor.role === 'doctor' && a.doctorId === actor.profileId)
    if (actor.role !== 'admin' && !own) throw E('PERMISSION_DENIED', 'You cannot modify this appointment.')
    if (actor.role === 'patient' && to !== 'cancelled') throw E('PERMISSION_DENIED', 'Patients can only cancel appointments.')
    if (!(TRANSITIONS[a.status] || []).includes(to)) throw E('INVALID_STATUS', `An appointment that is ${a.status.replace('_', ' ')} cannot be changed to ${to.replace('_', ' ')}.`)
    const slotRef = db.doc(`appointmentSlots/${slotId(a.doctorId, a.date, a.startTime)}`)
    const [sSnap, cfg] = await Promise.all([tx.get(slotRef), tx.get(db.doc('settings/hospital'))])
    if (actor.role === 'patient') {
      const windowMin = ((cfg.exists && cfg.data().cancelWindowHours) ?? 2) * 60
      if (minutesUntil(a.date, a.startTime) < windowMin) throw E('CANCELLATION_WINDOW', `Appointments cannot be cancelled less than ${windowMin / 60} hour(s) before the start time.`)
    }
    tx.update(aRef, { status: to, updatedAt: FieldValue.serverTimestamp(), ...(to === 'cancelled' ? { cancelledBy: actor.role } : {}) })
    if (to === 'cancelled' && sSnap.exists && sSnap.data().appointmentId === appointmentId) tx.delete(slotRef) // release slot
    const label = to.replace('_', ' ')
    if (actor.role !== 'patient') notifySet(tx, a.patientUid, { title: `Appointment ${label}`, message: `Your appointment ${appointmentId} with ${a.doctorName} on ${a.date} is now ${label}.`, type: to === 'cancelled' ? 'cancellation' : 'appointment', key: `${to}-${appointmentId}` })
    if (actor.role !== 'doctor') notifySet(tx, a.doctorUid, { title: `Appointment ${label}`, message: `${a.patientName}'s appointment on ${a.date} at ${a.startTime} is now ${label}.`, type: to === 'cancelled' ? 'cancellation' : 'appointment', key: `${to}-${appointmentId}` })
    auditSet(tx, actor, `appointment.${to}`, 'appointments', appointmentId)
  })
}

exports.cancelAppointment = handler(async (req) => {
  const actor = await requireRole(req, 'patient', 'doctor', 'admin')
  await changeStatus(actor, v.id(req.data?.appointmentId, 'appointmentId'), 'cancelled')
  return ok({}, 'Appointment cancelled.')
})
exports.updateAppointmentStatus = handler(async (req) => {
  const actor = await requireRole(req, 'doctor', 'admin')
  await changeStatus(actor, v.id(req.data?.appointmentId, 'appointmentId'), v.oneOf(req.data?.status, 'Status', STATUSES))
  return ok({}, 'Appointment updated.')
})

exports.saveConsultation = handler(async (req) => {
  const actor = await requireRole(req, 'doctor')
  const id = v.id(req.data?.appointmentId, 'appointmentId')
  const c = {
    symptoms: v.str(req.data?.symptoms, 'Symptoms', { max: 1000 }), diagnosis: v.str(req.data?.diagnosis, 'Diagnosis', { max: 300 }),
    notes: v.str(req.data?.notes, 'Notes', { min: 10, max: 4000 }), followUp: v.str(req.data?.followUp, 'Follow-up', { min: 0, max: 1000 }),
  }
  const complete = req.data?.markCompleted === true
  await db.runTransaction(async (tx) => {
    const aRef = db.doc(`appointments/${id}`); const rc = db.doc('counters/records')
    const [aSnap, rcSnap] = await Promise.all([tx.get(aRef), tx.get(rc)])
    if (!aSnap.exists) throw E('NOT_FOUND', 'Appointment not found.')
    const a = aSnap.data()
    if (a.doctorId !== actor.profileId) throw E('PERMISSION_DENIED', 'You cannot modify this appointment.')
    if (['cancelled', 'no_show'].includes(a.status)) throw E('INVALID_STATUS', 'Cannot add consultation notes to this appointment.')
    const n = nextN(rcSnap, 3001); const recordId = `REC-${n}`; const ts = FieldValue.serverTimestamp()
    tx.set(rc, { next: n + 1 })
    tx.update(aRef, { consultation: c, updatedAt: ts, ...(complete ? { status: 'completed' } : {}) })
    tx.set(db.doc(`medicalRecords/${recordId}`), { recordId, patientId: a.patientId, doctorId: a.doctorId, appointmentId: id, recordType: 'Consultation Record', documentName: `Consultation — ${c.diagnosis}`, storagePath: null, fileName: null, description: `${c.notes}\n\nFollow-up: ${c.followUp || 'None'}`, patientName: a.patientName, doctorName: a.doctorName, date: a.date, createdAt: ts })
    notifySet(tx, a.patientUid, { title: 'Consultation notes added', message: 'Your doctor added consultation notes to your records.', type: 'record', key: `consult-${id}-${n}` })
    auditSet(tx, actor, 'consultation.saved', 'appointments', id)
  })
  return ok({}, 'Consultation saved.')
})
