import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { apiError, audit, guard, nextNum, notify } from './helpers.js'
import { getSession } from './session.js'
import { recordFromDoc, rxFromDoc } from './mappers.js'

const scoped = (name, f = {}) => {
  const c = [collection(db, name)]
  if (f.patientId) c.push(where('patientId', '==', f.patientId))
  if (f.doctorId) c.push(where('doctorId', '==', f.doctorId))
  return query(...c)
}
const newest = (l) => l.sort((a, b) => b.date.localeCompare(a.date))
export const getRecords = async (f) => newest((await getDocs(scoped('medicalRecords', f))).docs.map((d) => recordFromDoc(d.data())))
export const getPrescriptions = async (f) => newest((await getDocs(scoped('prescriptions', f))).docs.map((d) => rxFromDoc(d.data())))

// Firebase Storage is a paid feature, so small files are stored as base64 documents (1 MiB Firestore limit).
const MAX_BYTES = 700 * 1024
const MAGIC = { 'application/pdf': [0x25, 0x50, 0x44, 0x46], 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47] }
const toBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(apiError('Could not read the file.')); r.readAsDataURL(file) })

export const addRecord = guard(async ({ file, patientId, type, name, date, notes }) => {
  const me = getSession()
  if (!file) throw apiError('Attach a file to upload.', 'INVALID_FILE')
  if (!MAGIC[file.type]) throw apiError('Only PDF, JPG and PNG files are allowed.', 'INVALID_FILE')
  if (file.size > MAX_BYTES) throw apiError('File must be 700 KB or smaller (free-plan limit).', 'INVALID_FILE')
  const b64 = await toBase64(file); const head = atob(b64.slice(0, 8))
  if (!MAGIC[file.type].every((v, i) => head.charCodeAt(i) === v)) throw apiError('File content does not match its type.', 'INVALID_FILE')
  const pid = me.role === 'patient' ? me.profileId : patientId
  const pS = await getDoc(doc(db, 'patients', pid)); if (!pS.exists()) throw apiError('Patient not found.', 'NOT_FOUND')
  await runTransaction(db, async (tx) => {
    const cRef = doc(db, 'counters', 'records'); const n = nextNum(await tx.get(cRef), 3001); const id = `REC-${n}`; const ts = serverTimestamp()
    tx.set(cRef, { next: n + 1 })
    tx.set(doc(db, 'medicalRecords', id), { recordId: id, patientId: pid, doctorId: me.role === 'doctor' ? me.profileId : null, appointmentId: null, recordType: type, documentName: name.trim(), storagePath: null, hasFile: true, fileName: file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80), contentType: file.type, size: file.size, description: notes || '', patientName: pS.data().name, doctorName: me.role === 'doctor' ? me.name : 'Self-uploaded', uploadedBy: me.userId, date, createdAt: ts })
    tx.set(doc(db, 'medicalRecords', id, 'files', 'main'), { dataBase64: b64, contentType: file.type })
    notify(tx, pS.data().uid, { title: 'New medical record', message: `${type} "${name.trim()}" was added to your records.`, type: 'record', key: `record-${id}` })
    audit(tx, 'record.uploaded', 'medicalRecords', id, { recordType: type })
  })
  return null
})

export const addPrescription = guard(async (d) => {
  const me = getSession()
  const meds = (d.medicines || []).map((m) => ({ name: m.name.trim(), dosage: m.dosage.trim(), frequency: m.frequency, duration: m.duration.trim(), instructions: (m.instructions || '').trim() }))
  if (!meds.length || meds.length > 10 || meds.some((m) => !m.name || !m.dosage || !m.duration)) throw apiError('Add 1–10 medicines with name, dosage and duration.', 'INVALID_ARGUMENT')
  const pS = await getDoc(doc(db, 'patients', d.patientId)); if (!pS.exists()) throw apiError('Patient not found.', 'NOT_FOUND')
  await runTransaction(db, async (tx) => {
    const cRef = doc(db, 'counters', 'prescriptions'); const n = nextNum(await tx.get(cRef), 4001); const id = `RX-${n}`
    tx.set(cRef, { next: n + 1 })
    tx.set(doc(db, 'prescriptions', id), { prescriptionId: id, patientId: d.patientId, doctorId: me.profileId, appointmentId: null, medicines: meds, instructions: d.notes || '', followUpDate: null, patientName: pS.data().name, doctorName: me.name, date: new Date().toISOString().slice(0, 10), createdAt: serverTimestamp() })
    notify(tx, pS.data().uid, { title: 'New prescription uploaded', message: `${me.name} added a prescription to your account.`, type: 'prescription', key: `rx-${id}` })
    audit(tx, 'prescription.created', 'prescriptions', id)
  })
  return null
})

// Authorized download: the rules only let the owner, the authoring doctor or an admin read the file document.
export async function downloadRecord(r) {
  if (!r.hasFile) return { demo: true, noFile: true, fileName: r.fileName }
  const s = await getDoc(doc(db, 'medicalRecords', r.id, 'files', 'main'))
  if (!s.exists()) throw apiError('File not found.', 'NOT_FOUND')
  const bytes = Uint8Array.from(atob(s.data().dataBase64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: s.data().contentType }))
  Object.assign(document.createElement('a'), { href: url, download: r.fileName }).click(); URL.revokeObjectURL(url)
  return { demo: false }
}
