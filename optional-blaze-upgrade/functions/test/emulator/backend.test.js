const test = require('node:test'); const assert = require('node:assert')
const H = require('./helpers')
const { call, db, admin } = H
const code = (r) => r.error?.code

let doc, admin1, p1, p2, p3, p4, other
test.before(async () => {
  doc = await H.seedDoctor('DOC-01', `doc-${H.uniq()}@t.test`, 'Dr. One')
  other = await H.seedDoctor('DOC-02', `doc2-${H.uniq()}@t.test`, 'Dr. Two')
  admin1 = await H.provision('admin', `admin-${H.uniq()}@t.test`, 'ADM-01', { name: 'Admin' })
  p1 = await H.registerPatient(`p1-${H.uniq()}@t.test`, 'Patient One'); p2 = await H.registerPatient(`p2-${H.uniq()}@t.test`, 'Patient Two')
  p3 = await H.registerPatient(`p3-${H.uniq()}@t.test`, 'Patient Three'); p4 = await H.registerPatient(`p4-${H.uniq()}@t.test`, 'Patient Four')   // p4 never books anyone
})

test('registration creates a patient role server-side; double registration rejected', async () => {
  assert.ok(p1.success, JSON.stringify(p1))
  const claims = (await admin.auth().getUser((await db.collection('users').where('profileId', '==', p1.data.profileId).get()).docs[0].id)).customClaims
  assert.strictEqual(claims.role, 'patient')
  assert.strictEqual(code(await call('completePatientRegistration', { name: 'X Y Z', phone: '+91 90000 00000', dateOfBirth: '1990-01-01', gender: 'Male' }, p1.token)), 'ALREADY_REGISTERED')
})

test('RBAC: unauthenticated and wrong-role calls are rejected', async () => {
  assert.strictEqual(code(await call('getAvailableSlots', { doctorId: 'DOC-01', date: H.dayPlus(3) })), 'UNAUTHENTICATED')
  assert.strictEqual(code(await call('setUserRole', { uid: 'x', role: 'admin' }, p1.token)), 'PERMISSION_DENIED')   // patient cannot escalate
  assert.strictEqual(code(await call('createDoctor', {}, p1.token)), 'PERMISSION_DENIED')
  assert.strictEqual(code(await call('addResource', {}, doc.token)), 'PERMISSION_DENIED')
})

test('booking: success, duplicate prevention, invalid doctor/date', async () => {
  const date = H.dayPlus(3)
  const ok = await call('bookAppointment', { doctorId: 'DOC-01', date, time: '09:00', reason: 'checkup' }, p1.token)
  assert.ok(ok.success, JSON.stringify(ok)); assert.strictEqual(ok.data.status, 'Pending')
  assert.strictEqual(code(await call('bookAppointment', { doctorId: 'DOC-01', date, time: '09:00' }, p2.token)), 'SLOT_UNAVAILABLE')
  assert.strictEqual(code(await call('bookAppointment', { doctorId: 'DOC-99', date, time: '09:30' }, p2.token)), 'DOCTOR_UNAVAILABLE')
  assert.strictEqual(code(await call('bookAppointment', { doctorId: 'DOC-01', date: H.dayPlus(-1), time: '09:30' }, p2.token)), 'DOCTOR_UNAVAILABLE')
  assert.strictEqual(code(await call('bookAppointment', { doctorId: 'DOC-01', date, time: '13:30' }, p2.token)), 'INVALID_SLOT')   // during break
  assert.strictEqual(code(await call('bookAppointment', { doctorId: 'DOC-01', date, time: '09:00' }, doc.token)), 'PERMISSION_DENIED') // doctors cannot book
})

test('booking: simultaneous attempts - exactly one wins', async () => {
  const date = H.dayPlus(4)
  const r = await Promise.all([call('bookAppointment', { doctorId: 'DOC-02', date, time: '10:00' }, p1.token), call('bookAppointment', { doctorId: 'DOC-02', date, time: '10:00' }, p2.token)])
  assert.strictEqual(r.filter((x) => x.success).length, 1, JSON.stringify(r))
  assert.strictEqual(r.filter((x) => code(x) === 'SLOT_UNAVAILABLE').length, 1)
  assert.strictEqual((await db.collection('appointmentSlots').where('doctorId', '==', 'DOC-02').where('date', '==', date).get()).size, 1)
})

test('cancellation releases the slot; other patients cannot cancel it', async () => {
  const date = H.dayPlus(5)
  const b = await call('bookAppointment', { doctorId: 'DOC-01', date, time: '11:00' }, p1.token)
  assert.strictEqual(code(await call('cancelAppointment', { appointmentId: b.data.id }, p2.token)), 'PERMISSION_DENIED')
  assert.ok((await call('cancelAppointment', { appointmentId: b.data.id }, p1.token)).success)
  assert.strictEqual(code(await call('cancelAppointment', { appointmentId: b.data.id }, p1.token)), 'INVALID_STATUS')
  assert.ok((await call('bookAppointment', { doctorId: 'DOC-01', date, time: '11:00' }, p2.token)).success)   // slot is free again
})

test('prescriptions: authorized doctor only; patient cannot create', async () => {
  const pid = p1.data.profileId
  const med = [{ name: 'Paracetamol', dosage: '500 mg', frequency: 'Twice daily', duration: '5 days', instructions: '' }]
  assert.ok((await call('createPrescription', { patientId: pid, medicines: med }, doc.token)).success)           // DOC-01 has p1 in careTeam
  assert.strictEqual(code(await call('createPrescription', { patientId: p4.data.profileId, medicines: med }, doc.token)), 'PERMISSION_DENIED') // p4 has no relationship with DOC-01
  assert.strictEqual(code(await call('createPrescription', { patientId: pid, medicines: med }, p1.token)), 'PERMISSION_DENIED')
  assert.strictEqual(code(await call('createPrescription', { patientId: pid, medicines: [] }, doc.token)), 'INVALID_ARGUMENT')
})

test('resources: admin assigns; conflicting assignment rejected', async () => {
  const mk = async (name) => (await call('addResource', { name, type: 'room', departmentId: 'DEP-1', status: 'available' }, admin1.token)).data.resourceId
  const [r1, r2] = [await mk('Room A1'), await mk('Room B1')]
  assert.ok((await call('assignResource', { resourceId: r1, patientId: p1.data.profileId }, admin1.token)).success)
  assert.strictEqual(code(await call('assignResource', { resourceId: r1, patientId: p2.data.profileId }, admin1.token)), 'RESOURCE_OCCUPIED')
  assert.strictEqual(code(await call('assignResource', { resourceId: r2, patientId: p1.data.profileId }, admin1.token)), 'ASSIGNMENT_CONFLICT')
  assert.ok((await call('releaseResource', { resourceId: r1 }, admin1.token)).success)
})

test('medical records: validated upload, owner-only download', async () => {
  assert.ok((await call('bookAppointment', { doctorId: 'DOC-01', date: H.dayPlus(6), time: '09:00' }, p3.token)).success)   // creates the doctor-patient relationship
  const pdf = Buffer.from('%PDF-1.4 test').toString('base64')
  const base = { patientId: p3.data.profileId, type: 'Lab Report', name: 'CBC panel', date: '2030-01-01', notes: '', fileName: 'cbc.pdf', contentType: 'application/pdf' }
  const up = await call('uploadMedicalRecord', { ...base, dataBase64: pdf }, doc.token)
  assert.ok(up.success, JSON.stringify(up))
  assert.strictEqual(code(await call('uploadMedicalRecord', { ...base, dataBase64: Buffer.from('not a pdf').toString('base64') }, doc.token)), 'INVALID_FILE')
  assert.strictEqual(code(await call('uploadMedicalRecord', { ...base, contentType: 'text/html', dataBase64: pdf }, doc.token)), 'INVALID_FILE')
  assert.strictEqual(code(await call('uploadMedicalRecord', { ...base, dataBase64: pdf }, other.token)), 'PERMISSION_DENIED')   // unrelated doctor
  assert.ok((await call('getMedicalRecordFile', { recordId: up.data.recordId }, p3.token)).success)
  assert.strictEqual(code(await call('getMedicalRecordFile', { recordId: up.data.recordId }, p1.token)), 'PERMISSION_DENIED')
})
