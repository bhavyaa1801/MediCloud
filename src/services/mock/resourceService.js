import { db, resolve, nextId, logAudit } from './db.js'

const withDept = (r) => ({ ...r, departmentName: db.get('departments', r.departmentId)?.name ?? '—', assignedName: r.assignedTo ? db.get('patients', r.assignedTo)?.name : null })
export const getResources = () => resolve(db.all('resources').map(withDept))

function checkConflicts(res, id) {
  if (res.status !== 'occupied' && res.assignedTo) throw new Error('Only occupied resources can have an assigned patient.')
  if (res.status === 'occupied' && !res.assignedTo && res.type !== 'Equipment') throw new Error('Select the patient assigned to this occupied resource.')
  if (res.assignedTo && res.type !== 'Equipment') {
    const clash = db.all('resources').find((r) => r.id !== id && r.type !== 'Equipment' && r.assignedTo === res.assignedTo && r.status === 'occupied')
    if (clash) throw new Error(`Patient is already assigned to ${clash.name}.`)
  }
}
export async function addResource(data) {
  checkConflicts(data)
  const r = db.insert('resources', { ...data, id: nextId('resources', 'RES', 1).replace(/-(\d)$/, '-0$1') })
  logAudit('Hospital Admin', 'Added resource', r.id)
  return resolve(withDept(r))
}
export async function updateResource(id, patch) {
  const next = { ...db.get('resources', id), ...patch }
  if (next.status !== 'occupied') next.assignedTo = null
  checkConflicts(next, id)
  const r = db.update('resources', id, next)
  logAudit('Hospital Admin', 'Updated resource', id)
  return resolve(withDept(r))
}
