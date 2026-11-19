import { db, resolve, nextId, logAudit } from './db.js'

export const getPatients = () => resolve(db.all('patients'))
export const getPatient = (id) => resolve(db.get('patients', id))
export const getDoctorPatients = (doctorId) => {
  const ids = new Set(db.all('appointments').filter((a) => a.doctorId === doctorId).map((a) => a.patientId))
  return resolve(db.all('patients').filter((p) => ids.has(p.id)))
}
export async function addPatient(data, actor = 'Hospital Admin') {
  if (db.all('users').some((u) => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error('Email already in use.')
  const id = nextId('patients', 'PT', 1001)
  const p = db.insert('patients', { bloodGroup: '', address: '', emergencyContact: '', status: 'active', ...data, id, registeredOn: new Date().toISOString().slice(0, 10) })
  db.insert('users', { id: `u-${id}`, profileId: id, name: p.name, email: p.email, role: 'patient', status: 'active' })
  logAudit(actor, 'Added patient', id)
  return resolve(p)
}
export async function updatePatient(id, patch, actor = 'System') {
  const p = db.update('patients', id, patch)
  const userPatch = {}
  if (patch.name) userPatch.name = p.name
  if (patch.status) userPatch.status = p.status
  if (Object.keys(userPatch).length) db.update('users', `u-${id}`, userPatch)
  logAudit(actor, patch.status ? `Set patient ${patch.status}` : 'Updated patient', id)
  return resolve(p)
}
