import { db, resolve, nextId, logAudit, pushNotification } from './db.js'
import { enrichDoc } from './lookups.js'

const byDate = (a, b) => b.date.localeCompare(a.date)
const filt = (rows, f = {}) => rows.filter((r) => (!f.patientId || r.patientId === f.patientId) && (!f.doctorId || r.doctorId === f.doctorId)).map(enrichDoc).sort(byDate)

export const getRecords = (f) => resolve(filt(db.all('records'), f))
export const getPrescriptions = (f) => resolve(filt(db.all('prescriptions'), f))

export async function addRecord(data, actor) {
  const { file, ...rest } = data
  const r = db.insert('records', { ...rest, id: nextId('records', 'REC', 3001) })
  pushNotification(`u-${r.patientId}`, 'New medical record', `${r.type} "${r.name}" was added to your records.`, 'record')
  logAudit(actor, 'Uploaded report', r.id)
  return resolve(enrichDoc(r))
}
export async function addPrescription(data, actor) {
  const rx = db.insert('prescriptions', { ...data, id: nextId('prescriptions', 'RX', 4001), date: new Date().toISOString().slice(0, 10) })
  pushNotification(`u-${rx.patientId}`, 'New prescription uploaded', `${db.get('doctors', rx.doctorId)?.name} added a prescription to your account.`, 'prescription')
  logAudit(actor, 'Uploaded prescription', rx.id)
  return resolve(enrichDoc(rx))
}

export const downloadRecord = async (r) => ({ demo: true, fileName: r.fileName })
