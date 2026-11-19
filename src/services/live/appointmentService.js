import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { apiError, audit, guard, nextNum, notify } from './helpers.js'
import { getSession } from './session.js'
import { apptFromDoc, byNewest, doctorFromDoc, statusToApi } from './mappers.js'
import { buildSlots, isWorkingDate, todayISO } from '../../utils/schedule.js'

const TRANSITIONS = { pending: ['confirmed', 'cancelled', 'completed'], confirmed: ['completed', 'cancelled', 'no_show'], completed: [], cancelled: [], no_show: [] }
const slotId = (d, date, t) => `${d}_${date}_${t.replace(':', '')}`
const list = async (q) => byNewest((await getDocs(q)).docs.map((d) => apptFromDoc(d.data())))
export const getAppointments = () => list(collection(db, 'appointments'))
export const getPatientAppointments = (pid) => list(query(collection(db, 'appointments'), where('patientId', '==', pid)))
export const getDoctorAppointments = (did) => list(query(collection(db, 'appointments'), where('doctorId', '==', did)))
export const getAppointment = async (id) => { try { const s = await getDoc(doc(db, 'appointments', id)); return s.exists() ? apptFromDoc(s.data()) : null } catch { return null } }

export async function getAvailableSlots(doctorId, date) {
  if (!doctorId || !date) return []
  const d = await getDoc(doc(db, 'doctors', doctorId)); if (!d.exists()) return []
  const booked = new Set((await getDocs(query(collection(db, 'appointmentSlots'), where('doctorId', '==', doctorId), where('date', '==', date)))).docs.map((s) => s.data().startTime))
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes()
  return buildSlots(doctorFromDoc(d.data()), date).filter((t) => date !== todayISO() || Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) > nowMin).map((time) => ({ time, booked: booked.has(time) }))
}

// The slot document (deterministic id, create-only in the rules) is the lock: two people cannot both create it.
export const bookAppointment = guard(async ({ patientId, doctorId, date, time, reason }) => {
  const me = getSession()
  const pid = me.role === 'patient' ? me.profileId : patientId
  const mine = await getDocs(query(collection(db, 'appointments'), where('patientId', '==', pid), where('date', '==', date)))
  if (mine.docs.some((x) => x.data().startTime === time && ['pending', 'confirmed'].includes(x.data().status))) throw apiError('The patient already has an appointment at this time.', 'PATIENT_CONFLICT')
  const slotRef = doc(db, 'appointmentSlots', slotId(doctorId, date, time)); const cRef = doc(db, 'counters', 'appointments'); const careRef = doc(db, 'patients', pid, 'careTeam', doctorId)
  return runTransaction(db, async (tx) => {
    const [dS, pS, sS, cS, careS, cfg] = await Promise.all([tx.get(doc(db, 'doctors', doctorId)), tx.get(doc(db, 'patients', pid)), tx.get(slotRef), tx.get(cRef), tx.get(careRef), tx.get(doc(db, 'settings', 'hospital'))])
    if (cfg.exists() && cfg.data().onlineBooking === false && me.role === 'patient') throw apiError('Online booking is currently disabled. Please contact reception.', 'BOOKING_DISABLED')
    if (!dS.exists() || dS.data().status !== 'active') throw apiError('This doctor is not available.', 'DOCTOR_UNAVAILABLE')
    if (!pS.exists() || pS.data().status !== 'active') throw apiError('Patient profile is not active.', 'PERMISSION_DENIED')
    const d = doctorFromDoc(dS.data()); const p = pS.data()
    if (!isWorkingDate(d, date)) throw apiError('The doctor is not available on this date.', 'DOCTOR_UNAVAILABLE')
    if (!buildSlots(d, date).includes(time)) throw apiError('This is not a valid time slot.', 'INVALID_SLOT')
    if (sS.exists()) throw apiError('This appointment slot is no longer available.', 'SLOT_UNAVAILABLE')
    const n = nextNum(cS, 2001); const id = `APT-${n}`; const ts = serverTimestamp()
    const end = new Date(new Date(`${date}T${time}:00+05:30`).getTime() + d.slotMinutes * 60000)
    const endTime = new Date(end.getTime() + 330 * 60000).toISOString().slice(11, 16)
    tx.set(cRef, { next: n + 1 })
    tx.set(slotRef, { doctorId, date, startTime: time, endTime, appointmentId: id, status: 'booked' })
    tx.set(doc(db, 'appointments', id), { appointmentId: id, patientId: pid, doctorId, departmentId: d.departmentId, patientUid: p.uid, doctorUid: dS.data().uid, patientName: p.name, doctorName: d.name, departmentName: d.departmentName, specialization: d.specialization, date, startTime: time, endTime, startAt: Timestamp.fromDate(new Date(`${date}T${time}:00+05:30`)), reason: (reason || '').trim().slice(0, 500) || 'General consultation', roomId: null, fee: d.fee, status: 'pending', createdAt: ts, updatedAt: ts })
    if (!careS.exists()) tx.set(careRef, { doctorId, appointmentId: id, since: ts })
    notify(tx, p.uid, { title: 'Appointment requested', message: `Your appointment with ${d.name} on ${date} at ${time} is pending confirmation.`, type: 'appointment', key: `booked-${id}` })
    notify(tx, dS.data().uid, { title: 'New appointment booked', message: `${p.name} booked a consultation on ${date} at ${time}.`, type: 'appointment', key: `booked-${id}` })
    audit(tx, 'appointment.booked', 'appointments', id, { doctorId, date, time })
    return { id, patientId: pid, doctorId, departmentId: d.departmentId, patientName: p.name, doctorName: d.name, departmentName: d.departmentName, specialization: d.specialization, date, time, endTime, reason, fee: d.fee, status: 'Pending' }
  })
})

async function changeStatus(id, to) {
  const me = getSession(); const aRef = doc(db, 'appointments', id)
  const cfg = await getDoc(doc(db, 'settings', 'hospital')); const windowH = cfg.exists() ? cfg.data().cancelWindowHours ?? 2 : 2
  await runTransaction(db, async (tx) => {
    const aS = await tx.get(aRef); if (!aS.exists()) throw apiError('Appointment not found.', 'NOT_FOUND')
    const a = aS.data()
    if (!(TRANSITIONS[a.status] || []).includes(to)) throw apiError(`An appointment that is ${a.status.replace('_', ' ')} cannot be changed to ${to.replace('_', ' ')}.`, 'INVALID_STATUS')
    if (me.role === 'patient' && a.startAt.toDate().getTime() - Date.now() < windowH * 3600000) throw apiError(`Appointments cannot be cancelled less than ${windowH} hour(s) before the start time.`, 'CANCELLATION_WINDOW')
    const slotRef = doc(db, 'appointmentSlots', slotId(a.doctorId, a.date, a.startTime))
    const sS = to === 'cancelled' ? await tx.get(slotRef) : null
    const label = to.replace('_', ' ')
    tx.update(aRef, { status: to, updatedAt: serverTimestamp(), ...(to === 'cancelled' ? { cancelledBy: me.role } : {}) })
    if (sS?.exists() && sS.data().appointmentId === id) tx.delete(slotRef) // releases the slot
    const type = to === 'cancelled' ? 'cancellation' : 'appointment'
    if (me.role !== 'patient') notify(tx, a.patientUid, { title: `Appointment ${label}`, message: `Your appointment ${id} with ${a.doctorName} on ${a.date} is now ${label}.`, type, key: `${to}-${id}` })
    if (me.role !== 'doctor') notify(tx, a.doctorUid, { title: `Appointment ${label}`, message: `${a.patientName}'s appointment on ${a.date} at ${a.startTime} is now ${label}.`, type, key: `${to}-${id}` })
    audit(tx, `appointment.${to}`, 'appointments', id)
  })
  return null
}
export const cancelAppointment = guard((id) => changeStatus(id, 'cancelled'))
export const updateAppointmentStatus = guard((id, status) => changeStatus(id, statusToApi(status)))

export const saveConsultation = guard(async (id, c, markCompleted) => {
  const me = getSession()
  if ((c.notes || '').trim().length < 10) throw apiError('Add consultation notes (at least 10 characters).', 'INVALID_ARGUMENT')
  await runTransaction(db, async (tx) => {
    const aRef = doc(db, 'appointments', id); const rc = doc(db, 'counters', 'records')
    const [aS, cS] = await Promise.all([tx.get(aRef), tx.get(rc)])
    if (!aS.exists()) throw apiError('Appointment not found.', 'NOT_FOUND')
    const a = aS.data()
    if (['cancelled', 'no_show'].includes(a.status)) throw apiError('Cannot add consultation notes to this appointment.', 'INVALID_STATUS')
    const n = nextNum(cS, 3001); const rid = `REC-${n}`; const ts = serverTimestamp()
    tx.set(rc, { next: n + 1 })
    tx.update(aRef, { consultation: { symptoms: c.symptoms, diagnosis: c.diagnosis, notes: c.notes, followUp: c.followUp || '' }, updatedAt: ts, ...(markCompleted && a.status !== 'completed' ? { status: 'completed' } : {}) })
    tx.set(doc(db, 'medicalRecords', rid), { recordId: rid, patientId: a.patientId, doctorId: a.doctorId, appointmentId: id, recordType: 'Consultation Record', documentName: `Consultation — ${c.diagnosis || 'General visit'}`, storagePath: null, hasFile: false, fileName: null, description: `${c.notes}\n\nFollow-up: ${c.followUp || 'None'}`, patientName: a.patientName, doctorName: a.doctorName, uploadedBy: me.userId, date: a.date, createdAt: ts })
    notify(tx, a.patientUid, { title: 'Consultation notes added', message: 'Your doctor added consultation notes to your records.', type: 'record', key: `consult-${id}-${n}` })
    audit(tx, 'consultation.saved', 'appointments', id)
  })
  return null
})
