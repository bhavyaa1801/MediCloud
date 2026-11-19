'use strict'
const { db, FieldValue, E, ok, handler, requireRole, v, auditSet } = require('../lib/common')
const { provision } = require('../lib/provision')

const GENDERS = ['Female', 'Male', 'Other']
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const future = (d) => d > new Date().toISOString().slice(0, 10)

function fields(p, partial) {
  const out = {}; const has = (k) => !partial || p[k] !== undefined
  if (has('name')) out.name = v.str(p.name, 'Name', { min: 3, max: 80 })
  if (has('phone')) out.phone = v.phone(p.phone)
  if (has('dateOfBirth')) { out.dateOfBirth = v.date(p.dateOfBirth, 'Date of birth'); if (future(out.dateOfBirth)) throw E('INVALID_ARGUMENT', 'Date of birth cannot be in the future.') }
  if (has('gender')) out.gender = v.oneOf(p.gender, 'Gender', GENDERS)
  if (p.bloodGroup !== undefined) out.bloodGroup = v.oneOf(p.bloodGroup, 'Blood group', BLOOD)
  if (p.address !== undefined) out.address = v.str(p.address, 'Address', { min: 0, max: 300 })
  if (p.emergencyContact !== undefined) out.emergencyContact = p.emergencyContact === '' ? '' : v.phone(p.emergencyContact, 'Emergency contact')
  return out
}

// Patients edit only themselves (patientId from the verified token); admins may edit anyone.
exports.updatePatientProfile = handler(async (req) => {
  const actor = await requireRole(req, 'patient', 'admin')
  const patientId = actor.role === 'patient' ? actor.profileId : v.id(req.data?.patientId, 'patientId')
  if (actor.role === 'patient' && req.data?.patientId && req.data.patientId !== actor.profileId) throw E('PERMISSION_DENIED', 'You can only edit your own profile.')
  const patch = fields(req.data?.patch || {}, true)
  const ref = db.doc(`patients/${patientId}`); const snap = await ref.get()
  if (!snap.exists) throw E('NOT_FOUND', 'Patient not found.')
  const ts = FieldValue.serverTimestamp(); const b = db.batch()
  b.update(ref, { ...patch, updatedAt: ts })
  const u = {}; ['name', 'phone'].forEach((k) => { if (patch[k] !== undefined) u[k] = patch[k] })
  if (Object.keys(u).length) b.update(db.doc(`users/${snap.data().uid}`), { ...u, updatedAt: ts })
  auditSet(b, actor, 'patient.updated', 'patients', patientId)
  await b.commit()
  return ok({}, 'Profile updated.')
})

exports.createPatient = handler(async (req) => {
  const actor = await requireRole(req, 'admin'); const p = req.data || {}
  const f = fields(p, false); const email = v.email(p.email)
  const { name, phone, ...rest } = f
  const { profileId } = await provision({ actor, role: 'patient', email, name, phone, profile: { bloodGroup: '', address: '', emergencyContact: '', ...rest } })
  return ok({ patientId: profileId }, 'Patient added. Send them a password-reset email to activate the account.')
})
