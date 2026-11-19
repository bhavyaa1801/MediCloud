import { db, resolve, logAudit } from './db.js'

export const getUsers = () => resolve(db.all('users'))
export async function updateUser(id, patch, actor = 'Hospital Admin') {
  const u = db.update('users', id, patch)
  if (patch.status && u.role === 'patient') db.update('patients', u.profileId, { status: patch.status })
  if (patch.status && u.role === 'doctor') db.update('doctors', u.profileId, { status: patch.status })
  logAudit(actor, patch.role ? `Changed role to ${patch.role}` : `Set account ${patch.status}`, u.email)
  return resolve(u)
}
export const getAuditLogs = () => resolve([...db.all('audit')].sort((a, b) => b.timestamp.localeCompare(a.timestamp)))
export const getSettings = () => resolve(db.all('settings'))
export async function saveSettings(s) { db.setObject('settings', s); logAudit('Hospital Admin', 'Updated settings', 'System'); return resolve(s) }

export async function exportData() {
  const name = `MediCloud-demo-backup-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(db.dump(), null, 2)], { type: 'application/json' })
  Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name }).click()
  return resolve({ fileName: name })
}
