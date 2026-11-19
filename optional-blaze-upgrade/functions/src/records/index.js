'use strict'
const { admin, db, FieldValue, E, ok, handler, requireRole, v, auditSet, notifySet, rateLimit, nextN } = require('../lib/common')

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ['Blood Report', 'MRI Report', 'X-Ray Report', 'Lab Report', 'Consultation Record']
const MIME = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
// Verify the real file signature, not just the client-claimed content type.
const MAGIC = { pdf: [0x25, 0x50, 0x44, 0x46], jpg: [0xff, 0xd8, 0xff], png: [0x89, 0x50, 0x4e, 0x47] }
const sniff = (buf, kind) => MAGIC[kind].every((b, i) => buf[i] === b)
const safeName = (n) => n.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80)

async function assertCareTeam(patientId, doctorId) {
  if (!(await db.doc(`patients/${patientId}/careTeam/${doctorId}`).get()).exists) throw E('PERMISSION_DENIED', 'You are not authorized to access this patient.')
}
async function loadRecord(id) {
  const s = await db.doc(`medicalRecords/${id}`).get()
  if (!s.exists) throw E('NOT_FOUND', 'Record not found.')
  return s.data()
}
function assertCanView(actor, r) {
  const okay = actor.role === 'admin' || (actor.role === 'patient' && r.patientId === actor.profileId) || (actor.role === 'doctor' && r.doctorId === actor.profileId)
  if (!okay) throw E('PERMISSION_DENIED', 'You are not authorized to access this record.')
}

exports.uploadMedicalRecord = handler(async (req) => {
  const actor = await requireRole(req, 'doctor', 'patient')
  await rateLimit(actor.uid, 'upload', 10, 600)
  const d = req.data || {}
  const patientId = actor.role === 'patient' ? actor.profileId : v.id(d.patientId, 'patientId')
  if (actor.role === 'patient' && d.patientId && d.patientId !== actor.profileId) throw E('PERMISSION_DENIED', 'You can only upload to your own records.')
  const pSnap = await db.doc(`patients/${patientId}`).get()
  if (!pSnap.exists) throw E('NOT_FOUND', 'Patient not found.')
  if (actor.role === 'doctor') await assertCareTeam(patientId, actor.profileId)
  const recordType = v.oneOf(d.type, 'Record type', TYPES); const documentName = v.str(d.name, 'Document name', { min: 3, max: 120 })
  const date = v.date(d.date, 'Date'); const description = v.str(d.notes, 'Notes', { min: 0, max: 2000 })
  const fileName = v.str(d.fileName, 'File name', { max: 150 })
  const ext = MIME[d.contentType]; if (!ext) throw E('INVALID_FILE', 'Only PDF, JPG and PNG files are allowed.')
  if (typeof d.dataBase64 !== 'string' || !d.dataBase64) throw E('INVALID_FILE', 'Attach a file to upload.')
  const buf = Buffer.from(d.dataBase64, 'base64')
  if (!buf.length || buf.length > MAX_BYTES) throw E('INVALID_FILE', 'File must be between 1 byte and 5 MB.')
  if (!sniff(buf, ext)) throw E('INVALID_FILE', 'File content does not match its type.')

  const p = pSnap.data()
  const doctorId = actor.role === 'doctor' ? actor.profileId : null
  const doctorName = actor.role === 'doctor' ? actor.name : 'Self-uploaded'
  const recordId = await db.runTransaction(async (tx) => {
    const cRef = db.doc('counters/records'); const n = nextN(await tx.get(cRef), 3001); const id = `REC-${n}`
    const storagePath = `medical-records/${patientId}/${id}/${safeName(fileName)}`
    tx.set(cRef, { next: n + 1 })
    tx.set(db.doc(`medicalRecords/${id}`), { recordId: id, patientId, doctorId, appointmentId: d.appointmentId ? v.id(d.appointmentId, 'appointmentId') : null, recordType, documentName, storagePath, fileName: safeName(fileName), contentType: d.contentType, size: buf.length, description, patientName: p.name, doctorName, uploadedBy: actor.uid, date, createdAt: FieldValue.serverTimestamp() })
    notifySet(tx, p.uid, { title: 'New medical record', message: `${recordType} "${documentName}" was added to your records.`, type: 'record', key: `record-${id}` })
    auditSet(tx, actor, 'record.uploaded', 'medicalRecords', id, { recordType })
    return id
  })
  const path = `medical-records/${patientId}/${recordId}/${safeName(fileName)}`
  try { await admin.storage().bucket().file(path).save(buf, { contentType: d.contentType, resumable: false }) }
  catch (e) { await db.doc(`medicalRecords/${recordId}`).delete(); throw E('UPLOAD_FAILED', 'The file could not be uploaded. Please try again.') }
  return ok({ recordId }, 'Record uploaded.')
})

// Authorized, private download: bytes are returned only after an authorization check (no public URLs).
exports.getMedicalRecordFile = handler(async (req) => {
  const actor = await requireRole(req)
  const r = await loadRecord(v.id(req.data?.recordId, 'recordId')); assertCanView(actor, r)
  if (!r.storagePath) throw E('NO_FILE', 'This record has no attached file.')
  const [buf] = await admin.storage().bucket().file(r.storagePath).download()
  const b = db.batch(); auditSet(b, actor, 'record.downloaded', 'medicalRecords', r.recordId); await b.commit()
  return ok({ fileName: r.fileName, contentType: r.contentType, dataBase64: buf.toString('base64') })
})

exports.deleteMedicalRecord = handler(async (req) => {
  const actor = await requireRole(req, 'admin', 'doctor')
  const r = await loadRecord(v.id(req.data?.recordId, 'recordId'))
  if (actor.role === 'doctor' && r.doctorId !== actor.profileId) throw E('PERMISSION_DENIED', 'You can only delete records you created.')
  if (r.storagePath) await admin.storage().bucket().file(r.storagePath).delete({ ignoreNotFound: true })
  const b = db.batch(); b.delete(db.doc(`medicalRecords/${r.recordId}`)); auditSet(b, actor, 'record.deleted', 'medicalRecords', r.recordId); await b.commit()
  return ok({}, 'Record deleted.')
})
