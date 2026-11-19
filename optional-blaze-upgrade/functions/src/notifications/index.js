'use strict'
const { db, ok, handler, requireRole, v, E } = require('../lib/common')

// Notifications are created server-side only (see notifySet in lib/common). Users can only mark their own as read.
exports.markNotificationAsRead = handler(async (req) => {
  const actor = await requireRole(req)
  const ref = db.doc(`notifications/${v.str(req.data?.notificationId, 'notificationId', { max: 160 })}`)
  const s = await ref.get()
  if (!s.exists || s.data().userId !== actor.uid) throw E('NOT_FOUND', 'Notification not found.')
  await ref.update({ isRead: true }); return ok()
})
exports.markAllNotificationsAsRead = handler(async (req) => {
  const actor = await requireRole(req)
  const snap = await db.collection('notifications').where('userId', '==', actor.uid).where('isRead', '==', false).limit(450).get()
  const b = db.batch(); snap.forEach((d) => b.update(d.ref, { isRead: true })); await b.commit()
  return ok({ updated: snap.size })
})
