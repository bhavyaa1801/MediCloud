import { collection, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { getSession } from './session.js'

export const apiError = (message, code = 'ERROR') => Object.assign(new Error(message), { code, isApi: true })
// Turns Firestore/Auth errors into friendly, non-leaky messages (the global toast shows them).
export function toApiError(e) {
  if (e?.isApi) return e
  const c = e?.code || ''
  if (c === 'permission-denied') return apiError('You are not allowed to do that (or your session changed). Please refresh and try again.', 'PERMISSION_DENIED')
  if (c === 'unavailable' || c === 'auth/network-request-failed') return apiError('Network error. Check your connection and try again.', 'NETWORK')
  if (c === 'aborted' || c === 'failed-precondition') return apiError('Another change happened at the same time. Please try again.', 'CONFLICT')
  if (c === 'resource-exhausted') return apiError('Daily free usage limit reached. Try again tomorrow.', 'QUOTA')
  return apiError('Something went wrong. Please try again.', 'INTERNAL')
}
export const guard = (fn) => async (...a) => { try { return await fn(...a) } catch (e) { throw toApiError(e) } }

// Audit entries: append-only; the rules force actorId/actorRole to be the signed-in user's own.
export function audit(w, action, resourceType, resourceId, metadata = {}) {
  const me = getSession()
  w.set(doc(collection(db, 'auditLogs')), { actorId: me.userId, actorRole: me.role, actorName: me.name, action, resourceType, resourceId, status: 'Success', metadata, timestamp: serverTimestamp() })
}
// Deterministic id when `key` is given -> a repeated action cannot create duplicate notifications.
export function notify(w, userId, { title, message, type, key }) {
  const id = key ? `${userId}_${key}` : doc(collection(db, 'notifications')).id
  w.set(doc(db, 'notifications', id), { notificationId: id, userId, title, message, type, isRead: false, createdAt: serverTimestamp() })
}
export const nextNum = (snap, start) => (snap.exists() ? snap.data().next : start)
