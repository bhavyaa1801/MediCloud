import { db, resolve, nextId, logAudit } from './db.js'
import { DEMO_PASSWORD } from './authService.js'

const withDept = (d) => ({ ...d, departmentName: db.get('departments', d.departmentId)?.name ?? 'Unassigned' })
export const getDoctors = () => resolve(db.all('doctors').map(withDept))
export const getDoctor = (id) => resolve(db.get('doctors', id) ? withDept(db.get('doctors', id)) : null)
export const getDepartments = () => resolve(db.all('departments').map((d) => ({ ...d, doctorCount: db.all('doctors').filter((x) => x.departmentId === d.id).length })))

export async function addDoctor(data, actor = 'Hospital Admin') {
  if (db.all('users').some((u) => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error('Email already in use.')
  const id = nextId('doctors', 'DOC', 1)
  const num = id.split('-')[1].padStart(2, '0')
  const doc = db.insert('doctors', { blockedDates: [], breakStart: '13:00', breakEnd: '14:00', slotMinutes: 30, bio: '', status: 'active', ...data, id: `DOC-${num}` })
  db.insert('users', { id: `u-${doc.id}`, profileId: doc.id, name: doc.name, email: doc.email, role: 'doctor', status: 'active' })
  logAudit(actor, 'Added doctor', doc.name)
  return resolve(withDept(doc))
}
export async function updateDoctor(id, patch, actor = 'Hospital Admin') {
  const doc = db.update('doctors', id, patch)
  if (patch.name || patch.email || patch.status) db.update('users', `u-${id}`, { name: doc.name, email: doc.email, status: doc.status })
  logAudit(actor, 'Updated doctor', doc.name)
  return resolve(withDept(doc))
}
export async function addDepartment(data) {
  const d = db.insert('departments', { id: nextId('departments', 'DEP', 1), ...data })
  logAudit('Hospital Admin', 'Added department', d.name)
  return resolve(d)
}
export async function updateDepartment(id, patch) {
  const d = db.update('departments', id, patch)
  logAudit('Hospital Admin', 'Updated department', id)
  return resolve(d)
}
export { DEMO_PASSWORD }
