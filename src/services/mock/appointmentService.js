import { db, resolve, nextId, logAudit, pushNotification } from './db.js'
import { enrichAppointment } from './lookups.js'
import { buildSlots, isWorkingDate } from '../../utils/schedule.js'

const sorted = (list) => list.map(enrichAppointment).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

export const getAppointments = () => resolve(sorted(db.all('appointments')))
export const getPatientAppointments = (patientId) => resolve(sorted(db.all('appointments').filter((a) => a.patientId === patientId)))
export const getDoctorAppointments = (doctorId) => resolve(sorted(db.all('appointments').filter((a) => a.doctorId === doctorId)))
export const getAppointment = (id) => resolve(db.get('appointments', id) ? enrichAppointment(db.get('appointments', id)) : null)

export async function getAvailableSlots(doctorId, date) {
  const doc = db.get('doctors', doctorId)
  if (!doc || !date) return resolve([])
  const booked = db.all('appointments').filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'Cancelled').map((a) => a.time)
  return resolve(buildSlots(doc, date).map((time) => ({ time, booked: booked.includes(time) })))
}

// NOTE: in production this validation MUST run server-side (Cloud Function / Firestore rules).
export async function bookAppointment({ patientId, doctorId, date, time, reason }) {
  const doc = db.get('doctors', doctorId)
  if (!doc || doc.status !== 'active') throw new Error('Doctor is not available.')
  if (!isWorkingDate(doc, date)) throw new Error('Doctor is not available on this date.')
  if (!buildSlots(doc, date).includes(time)) throw new Error('Invalid time slot.')
  const clash = db.all('appointments').some((a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'Cancelled')
  if (clash) throw new Error('This slot was just booked. Please choose another.')
  const appt = db.insert('appointments', { id: nextId('appointments', 'APT', 2001), patientId, doctorId, departmentId: doc.departmentId,
    date, time, reason: reason?.trim() || 'General consultation', fee: doc.fee, status: 'Pending', createdAt: new Date().toISOString() })
  const patient = db.get('patients', patientId)
  pushNotification(`u-${patientId}`, 'Appointment requested', `Your appointment with ${doc.name} on ${date} at ${time} is pending confirmation.`, 'appointment')
  pushNotification(`u-${doctorId}`, 'New appointment booked', `${patient.name} booked a consultation on ${date} at ${time}.`, 'appointment')
  logAudit(patient.name, 'Booked appointment', appt.id)
  return resolve(enrichAppointment(appt))
}

export const cancelAppointment = (id, actor = 'Patient') => updateAppointmentStatus(id, 'Cancelled', actor)

export async function updateAppointmentStatus(id, status, actor = 'System') {
  const a = db.update('appointments', id, { status })
  pushNotification(`u-${a.patientId}`, `Appointment ${status.toLowerCase()}`, `Appointment ${id} is now ${status.toLowerCase()}.`, status === 'Cancelled' ? 'cancellation' : 'appointment')
  logAudit(actor, `Set appointment ${status.toLowerCase()}`, id)
  return resolve(enrichAppointment(a))
}

export async function saveConsultation(id, consultation, markCompleted, actor) {
  const a = db.update('appointments', id, { consultation, ...(markCompleted ? { status: 'Completed' } : {}) })
  db.insert('records', { id: nextId('records', 'REC', 3001), patientId: a.patientId, doctorId: a.doctorId, type: 'Consultation Record',
    name: `Consultation — ${consultation.diagnosis || 'General visit'}`, date: a.date, fileName: `consultation-${id}.pdf`,
    notes: `${consultation.notes}\n\nFollow-up: ${consultation.followUp || 'None'}` })
  pushNotification(`u-${a.patientId}`, 'Consultation notes added', 'Your doctor added consultation notes to your records.', 'record')
  logAudit(actor, 'Updated consultation', id)
  return resolve(enrichAppointment(a))
}
