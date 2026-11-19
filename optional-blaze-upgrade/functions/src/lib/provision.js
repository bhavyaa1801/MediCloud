'use strict'
const crypto = require('crypto')
const { admin, db, FieldValue, E, auditSet, nextN } = require('./common')

const CFG = {
  doctor: { col: 'doctors', counter: 'doctors', prefix: 'DOC-', start: 1, pad: 2, idField: 'doctorId' },
  patient: { col: 'patients', counter: 'patients', prefix: 'PT-', start: 1001, pad: 0, idField: 'patientId' },
}

// Creates (or adopts) an Auth user, the profile doc, the users doc and trusted role claims.
async function provision({ actor, role, uid, email, name, phone, profile }) {
  const c = CFG[role]
  let created = false
  if (!uid) {
    try { await admin.auth().getUserByEmail(email); throw E('EMAIL_EXISTS', 'An account with this email already exists.') } catch (e) { if (e.code !== 'auth/user-not-found') throw e }
    const u = await admin.auth().createUser({ email, displayName: name, password: crypto.randomBytes(18).toString('base64url') })
    uid = u.uid; created = true
  }
  let profileId
  try {
    profileId = await db.runTransaction(async (tx) => {
      const cRef = db.doc(`counters/${c.counter}`)
      const cSnap = await tx.get(cRef)
      const n = nextN(cSnap, c.start)
      const id = c.prefix + String(n).padStart(c.pad, '0')
      const ts = FieldValue.serverTimestamp()
      tx.set(cRef, { next: n + 1 })
      tx.set(db.doc(`${c.col}/${id}`), { ...profile, uid, [c.idField]: id, name, email, phone, status: 'active', createdAt: ts, updatedAt: ts })
      tx.set(db.doc(`users/${uid}`), { uid, name, email, phone, role, profileId: id, profileImage: null, status: 'active', createdAt: ts, updatedAt: ts })
      auditSet(tx, actor || { uid, role }, `${role}.created`, c.col, id)
      return id
    })
    await admin.auth().setCustomUserClaims(uid, { role, profileId })
  } catch (e) {
    if (created) await admin.auth().deleteUser(uid).catch(() => {})
    throw e
  }
  return { uid, profileId }
}

module.exports = { provision }
