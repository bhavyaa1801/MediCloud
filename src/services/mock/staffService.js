import { db, resolve, nextId, logAudit } from './db.js'

export const getStaff = (id) => resolve(db.get('staff', id))
export async function updateStaff(id, p) {
  const s = db.update('staff', id, { name: p.name, phone: p.phone }); db.update('users', `u-${id}`, { name: p.name })
  return resolve(s)
}
export async function addStaff(d) {
  if (db.all('users').some((u) => u.email.toLowerCase() === d.email.toLowerCase())) throw new Error('Email already in use.')
  const id = nextId('staff', 'REC', 1)
  db.insert('staff', { id, name: d.name, email: d.email, phone: d.phone, status: 'active' })
  db.insert('users', { id: `u-${id}`, profileId: id, name: d.name, email: d.email, role: 'receptionist', status: 'active' })
  logAudit('Hospital Admin', 'Added receptionist', id)
  return resolve(null)
}
