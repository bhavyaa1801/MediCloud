import { db } from './db.js'
const name = (t, id) => db.get(t, id)?.name ?? 'Unknown'
export const enrichAppointment = (a) => ({
  ...a, patientName: name('patients', a.patientId), doctorName: name('doctors', a.doctorId),
  departmentName: name('departments', a.departmentId), specialization: db.get('doctors', a.doctorId)?.specialization ?? '',
})
export const enrichDoc = (r) => ({ ...r, patientName: name('patients', r.patientId), doctorName: name('doctors', r.doctorId) })
