'use strict'
const { db, FieldValue, E, ok, handler, requireRole, v, auditSet, notifySet, nextN } = require('../lib/common')

exports.createPrescription = handler(async (req) => {
  const actor = await requireRole(req, 'doctor'); const d = req.data || {}
  const patientId = v.id(d.patientId, 'patientId')
  if (!Array.isArray(d.medicines) || d.medicines.length < 1 || d.medicines.length > 10) throw E('INVALID_ARGUMENT', 'Add between 1 and 10 medicines.')
  const medicines = d.medicines.map((m, i) => ({
    name: v.str(m?.name, `Medicine ${i + 1} name`, { max: 100 }), dosage: v.str(m?.dosage, `Medicine ${i + 1} dosage`, { max: 50 }),
    frequency: v.str(m?.frequency, `Medicine ${i + 1} frequency`, { max: 50 }), duration: v.str(m?.duration, `Medicine ${i + 1} duration`, { max: 50 }),
    instructions: v.str(m?.instructions, `Medicine ${i + 1} instructions`, { min: 0, max: 300 }),
  }))
  const instructions = v.str(d.instructions, 'Instructions', { min: 0, max: 1000 })
  const followUpDate = d.followUpDate ? v.date(d.followUpDate, 'Follow-up date') : null
  const appointmentId = d.appointmentId ? v.id(d.appointmentId, 'appointmentId') : null
  const id = await db.runTransaction(async (tx) => {
    const cRef = db.doc('counters/prescriptions')
    const [c, p, team] = await Promise.all([tx.get(cRef), tx.get(db.doc(`patients/${patientId}`)), tx.get(db.doc(`patients/${patientId}/careTeam/${actor.profileId}`))])
    if (!p.exists) throw E('NOT_FOUND', 'Patient not found.')
    if (!team.exists) throw E('PERMISSION_DENIED', 'You can only prescribe for patients who have booked with you.')
    const n = nextN(c, 4001); const id = `RX-${n}`
    tx.set(cRef, { next: n + 1 })
    tx.set(db.doc(`prescriptions/${id}`), { prescriptionId: id, patientId, doctorId: actor.profileId, appointmentId, medicines, instructions, followUpDate, patientName: p.data().name, doctorName: actor.name, date: new Date().toISOString().slice(0, 10), createdAt: FieldValue.serverTimestamp() })
    notifySet(tx, p.data().uid, { title: 'New prescription uploaded', message: `${actor.name} added a prescription to your account.`, type: 'prescription', key: `rx-${id}` })
    auditSet(tx, actor, 'prescription.created', 'prescriptions', id)
    return id
  })
  return ok({ prescriptionId: id }, 'Prescription saved.')
})
