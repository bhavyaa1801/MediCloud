const test = require('node:test'); const assert = require('node:assert')
const fs = require('fs'); const path = require('path')
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const { collection, doc, getDoc, getDocs, query, where, setDoc, deleteDoc, updateDoc } = require('firebase/firestore')

let env
const ctx = (role, profileId, uid) => env.authenticatedContext(uid || `${role}-${profileId}`, { role, profileId }).firestore()
test.before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-rules', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } })
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore()
    await setDoc(doc(d, 'appointments/A1'), { appointmentId: 'A1', patientId: 'PT-1', doctorId: 'DOC-1' })
    await setDoc(doc(d, 'appointments/A2'), { appointmentId: 'A2', patientId: 'PT-2', doctorId: 'DOC-2' })
    await setDoc(doc(d, 'patients/PT-1'), { patientId: 'PT-1', name: 'One' }); await setDoc(doc(d, 'patients/PT-1/careTeam/DOC-1'), { doctorId: 'DOC-1' })
    await setDoc(doc(d, 'medicalRecords/R1'), { patientId: 'PT-1', doctorId: 'DOC-1' }); await setDoc(doc(d, 'auditLogs/L1'), { action: 'x' })
    await setDoc(doc(d, 'notifications/N1'), { userId: 'patient-PT-1', isRead: false })
  })
})
test.after(() => env.cleanup())

test('patient reads only own appointments (query constrained) and cannot read others', async () => {
  const d = ctx('patient', 'PT-1')
  await assertSucceeds(getDocs(query(collection(d, 'appointments'), where('patientId', '==', 'PT-1'))))
  await assertFails(getDocs(collection(d, 'appointments')))                       // unconstrained query is not a filter
  await assertFails(getDoc(doc(d, 'appointments/A2')))
})
test('patient can read own record but not write anything', async () => {
  const d = ctx('patient', 'PT-1')
  await assertSucceeds(getDoc(doc(d, 'medicalRecords/R1')))
  await assertFails(setDoc(doc(d, 'appointments/A3'), { patientId: 'PT-1' }))
  await assertFails(updateDoc(doc(d, 'appointments/A1'), { status: 'confirmed' }))
  await assertFails(updateDoc(doc(d, 'notifications/N1'), { isRead: true }))        // via function only
  await assertFails(setDoc(doc(d, 'users/patient-PT-1'), { role: 'admin' }))        // no role self-assignment
})
test('doctor sees only patients in care team and own appointments', async () => {
  await assertSucceeds(getDoc(doc(ctx('doctor', 'DOC-1'), 'patients/PT-1')))
  await assertFails(getDoc(doc(ctx('doctor', 'DOC-2'), 'patients/PT-1')))
  await assertFails(getDoc(doc(ctx('doctor', 'DOC-2'), 'appointments/A1')))
  await assertFails(getDoc(doc(ctx('doctor', 'DOC-2'), 'medicalRecords/R1')))
})
test('audit logs: admin read only; nobody writes; notifications are private', async () => {
  await assertSucceeds(getDoc(doc(ctx('admin', 'ADM-1'), 'auditLogs/L1')))
  await assertFails(getDoc(doc(ctx('patient', 'PT-1'), 'auditLogs/L1')))
  await assertFails(setDoc(doc(ctx('admin', 'ADM-1'), 'auditLogs/L2'), { action: 'forged' }))
  await assertFails(deleteDoc(doc(ctx('admin', 'ADM-1'), 'auditLogs/L1')))
  await assertSucceeds(getDoc(doc(ctx('patient', 'PT-1', 'patient-PT-1'), 'notifications/N1')))
  await assertFails(getDoc(doc(ctx('patient', 'PT-2'), 'notifications/N1')))
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'patients/PT-1')))
})
