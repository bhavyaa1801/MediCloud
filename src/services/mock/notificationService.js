import { db, resolve } from './db.js'

export const getNotifications = (userId) => resolve(db.all('notifications').filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
export const getUnreadCount = (userId) => db.all('notifications').filter((n) => n.userId === userId && !n.read).length
export const markAsRead = (id) => resolve(db.update('notifications', id, { read: true }))
export async function markAllAsRead(userId) {
  db.all('notifications').filter((n) => n.userId === userId && !n.read).forEach((n) => db.update('notifications', n.id, { read: true }))
  return resolve(true)
}
