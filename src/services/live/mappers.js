// Firestore (spec schema) <-> frontend model mapping. Keeps page components unchanged.
export const iso = (t) => (t?.toDate ? t.toDate().toISOString() : t ?? null)
const STATUS = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show' }
export const statusToApi = (s) => String(s).toLowerCase().replace(/\s+/g, '_')
const TYPE_UI = { room: 'Consultation Room', bed: 'Bed', equipment: 'Equipment' }
export const typeToApi = (t) => Object.keys(TYPE_UI).find((k) => TYPE_UI[k] === t) || t

export const apptFromDoc = (d) => ({
  id: d.appointmentId, patientId: d.patientId, doctorId: d.doctorId, departmentId: d.departmentId, patientName: d.patientName,
  doctorName: d.doctorName, departmentName: d.departmentName, specialization: d.specialization, date: d.date, time: d.startTime,
  endTime: d.endTime, reason: d.reason, fee: d.fee, status: STATUS[d.status] ?? d.status, createdAt: iso(d.createdAt), consultation: d.consultation,
})
export const byNewest = (l) => l.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

export const doctorFromDoc = (d) => ({
  id: d.doctorId, name: d.name, email: d.email, phone: d.phone, departmentId: d.departmentId, departmentName: d.departmentName || 'Unassigned',
  specialization: d.specialization, experience: d.experience, fee: d.consultationFee, qualifications: d.qualifications, bio: d.bio || '',
  workingDays: d.availability?.workingDays ?? [], slotMinutes: d.availability?.slotMinutes ?? 30, blockedDates: d.availability?.blockedDates ?? [],
  start: d.workingHours?.start, end: d.workingHours?.end, breakStart: d.workingHours?.breakStart, breakEnd: d.workingHours?.breakEnd, status: d.status,
})
export const patientFromDoc = (d) => ({
  id: d.patientId, name: d.name, email: d.email, phone: d.phone, dob: d.dateOfBirth, gender: d.gender, bloodGroup: d.bloodGroup || '',
  address: d.address || '', emergencyContact: d.emergencyContact || '', registeredOn: (iso(d.createdAt) || '').slice(0, 10), status: d.status,
})
export const recordFromDoc = (d) => ({
  id: d.recordId, patientId: d.patientId, doctorId: d.doctorId, type: d.recordType, name: d.documentName, date: d.date || (iso(d.createdAt) || '').slice(0, 10),
  fileName: d.fileName || '—', notes: d.description, patientName: d.patientName, doctorName: d.doctorName, hasFile: d.hasFile ?? !!d.storagePath,
})
export const rxFromDoc = (d) => ({
  id: d.prescriptionId, patientId: d.patientId, doctorId: d.doctorId, date: d.date || (iso(d.createdAt) || '').slice(0, 10),
  medicines: d.medicines, notes: d.instructions, followUpDate: d.followUpDate, patientName: d.patientName, doctorName: d.doctorName,
})
export const resourceFromDoc = (d) => ({
  id: d.resourceId, name: d.name, type: TYPE_UI[d.type] ?? d.type, departmentId: d.departmentId, departmentName: d.departmentName || '—',
  status: d.status, assignedTo: d.assignedPatientId, assignedName: d.assignedPatientName,
})
export const notifFromDoc = (d) => ({ id: d.notificationId, userId: d.userId, title: d.title, message: d.message, type: d.type, read: d.isRead, createdAt: iso(d.createdAt) || new Date().toISOString() })
export const auditFromDoc = (d, id) => ({ id, actor: d.actorName || d.actorId, action: d.action, resource: `${d.resourceType} ${d.resourceId}`, status: d.status || 'Success', timestamp: iso(d.timestamp) || new Date().toISOString() })
