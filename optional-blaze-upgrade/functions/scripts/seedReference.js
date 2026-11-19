'use strict'
// Seeds reference data: departments, resources, settings. `--demo` also creates demo doctors/patients
// and is REFUSED unless the Auth emulator is in use (never put demo accounts in production).
const admin = require('firebase-admin')
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID })
const db = admin.firestore(); const ts = admin.firestore.FieldValue.serverTimestamp()
const DEMO = process.argv.includes('--demo')
if (DEMO && !process.env.FIREBASE_AUTH_EMULATOR_HOST) { console.error('--demo requires the Auth emulator (FIREBASE_AUTH_EMULATOR_HOST).'); process.exit(1) }

const depts = [['General Medicine', 'Primary care and chronic condition management', 'Dr. Rohan Verma'], ['Cardiology', 'Heart and vascular care', 'Dr. Priya Nair'], ['Neurology', 'Brain, spine and nervous system', 'Dr. Sameer Khan'], ['Dermatology', 'Skin, hair and nail conditions', 'Dr. Isha Malhotra'], ['Orthopedics', 'Bone, joint and sports injuries', 'Dr. Arjun Reddy'], ['Pediatrics', 'Healthcare for infants, children and teens', 'Dr. Kavya Iyer'], ['Gynecology', 'Women’s health, maternity and fertility', 'Dr. Neha Bansal'], ['Emergency Medicine', '24/7 trauma and critical care', 'Dr. Vikram Singh']]
const res = [['Consultation Room 101', 'room', 0], ['Consultation Room 102', 'room', 1], ['Consultation Room 103', 'room', 2], ['Consultation Room 104', 'room', 4], ['ICU Bed 01', 'bed', 7], ['ICU Bed 02', 'bed', 7], ['Ward Bed 12', 'bed', 0], ['Maternity Bed 03', 'bed', 6], ['ECG Machine A', 'equipment', 1], ['MRI Scanner', 'equipment', 2], ['Digital X-Ray Unit', 'equipment', 4], ['Ventilator V2', 'equipment', 7]]
const doctors = [['Rohan Verma', 0, 'Internal Medicine', 12, 600, 'MBBS, MD (Medicine)', 'doctor@MediCloud.demo'], ['Priya Nair', 1, 'Interventional Cardiology', 15, 1200, 'MBBS, DM (Cardiology)'], ['Sameer Khan', 2, 'Neurology', 11, 1100, 'MBBS, DM (Neurology)'], ['Isha Malhotra', 3, 'Clinical Dermatology', 8, 800, 'MBBS, MD (Dermatology)'], ['Arjun Reddy', 4, 'Joint Replacement', 14, 1000, 'MBBS, MS (Orthopedics)'], ['Kavya Iyer', 5, 'Pediatrics', 9, 700, 'MBBS, DCH, MD (Pediatrics)']]

;(async () => {
  const b = db.batch()
  depts.forEach(([name, description, head], i) => b.set(db.doc(`departments/DEP-${i + 1}`), { departmentId: `DEP-${i + 1}`, name, description, head, status: 'active', createdAt: ts }))
  b.set(db.doc('counters/departments'), { next: depts.length + 1 })
  res.forEach(([name, type, d], i) => { const id = `RES-${String(i + 1).padStart(2, '0')}`; b.set(db.doc(`resources/${id}`), { resourceId: id, name, type, departmentId: `DEP-${d + 1}`, departmentName: depts[d][0], status: 'available', assignedPatientId: null, assignedAppointmentId: null, assignedPatientName: null, createdAt: ts, updatedAt: ts }) })
  b.set(db.doc('counters/resources'), { next: res.length + 1 })
  b.set(db.doc('settings/hospital'), { hospitalName: 'MediCloud Multispeciality Hospital', email: 'info@MediCloud.demo', phone: '+91 11 4000 1234', address: '21 Health Avenue, New Delhi, India', onlineBooking: true, emailAlerts: true, cancelWindowHours: 2 })
  await b.commit(); console.log('Reference data seeded.')
  if (!DEMO) return
  const mk = async (email, name, role, profileId, extra) => {
    const u = await admin.auth().createUser({ email, password: 'demo1234', displayName: name })
    await admin.auth().setCustomUserClaims(u.uid, { role, profileId })
    await db.doc(`users/${u.uid}`).set({ uid: u.uid, name, email, phone: '+91 98100 00000', role, profileId, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
    return u.uid
  }
  let n = 1
  for (const [nm, d, spec, exp, fee, q, email] of doctors) {
    const id = `DOC-${String(n++).padStart(2, '0')}`; const name = `Dr. ${nm}`
    const uid = await mk(email || `${nm.split(' ')[0].toLowerCase()}@MediCloud.demo`, name, 'doctor', id)
    await db.doc(`doctors/${id}`).set({ uid, doctorId: id, name, email: email || `${nm.split(' ')[0].toLowerCase()}@MediCloud.demo`, phone: '+91 98100 00000', specialization: spec, departmentId: `DEP-${d + 1}`, departmentName: depts[d][0], qualifications: q, experience: exp, consultationFee: fee, bio: `${spec} specialist with ${exp} years of practice.`, workingHours: { start: '09:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' }, availability: { workingDays: [1, 2, 3, 4, 5], slotMinutes: 30, blockedDates: [] }, status: 'active', createdAt: ts, updatedAt: ts })
  }
  await db.doc('counters/doctors').set({ next: n })
  const pid = 'PT-1001'; const puid = await mk('patient@MediCloud.demo', 'Aarav Mehta', 'patient', pid)
  await db.doc(`patients/${pid}`).set({ uid: puid, patientId: pid, name: 'Aarav Mehta', email: 'patient@MediCloud.demo', phone: '+91 97000 20000', dateOfBirth: '1995-04-12', gender: 'Male', bloodGroup: 'O+', address: '12, Sector 3, New Delhi', emergencyContact: '', status: 'active', createdAt: ts, updatedAt: ts })
  await db.doc('counters/patients').set({ next: 1002 })
  console.log('Demo users created (password: demo1234). Admin: run provision:admin.')
})().catch((e) => { console.error(e); process.exit(1) })
