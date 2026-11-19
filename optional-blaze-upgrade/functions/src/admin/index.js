'use strict'
const { db, ok, handler, requireRole, v, auditSet } = require('../lib/common')

exports.updateSettings = handler(async (req) => {
  const actor = await requireRole(req, 'admin'); const s = req.data || {}
  const settings = {
    hospitalName: v.str(s.hospitalName, 'Hospital name', { min: 3, max: 120 }), email: v.email(s.email), phone: v.phone(s.phone),
    address: v.str(s.address, 'Address', { min: 0, max: 300 }), onlineBooking: s.onlineBooking === true, emailAlerts: s.emailAlerts === true,
    cancelWindowHours: v.num(s.cancelWindowHours, 'Cancellation window', { max: 168 }),
  }
  const b = db.batch(); b.set(db.doc('settings/hospital'), settings); auditSet(b, actor, 'settings.updated', 'settings', 'hospital'); await b.commit()
  return ok({}, 'Settings saved.')
})
