'use strict'
const admin = require('firebase-admin')
const { onCall } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

class AppError extends Error { constructor(code, message) { super(message); this.code = code } }
const E = (code, message) => new AppError(code, message)
const ok = (data = {}, message = 'OK') => ({ success: true, data, message })

// Wraps every callable: consistent {success,data|error} responses, no internals leaked.
function handler(fn, opts = {}) {
  return onCall({ cors: true, enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', ...opts }, async (req) => {
    try { return await fn(req) } catch (e) {
      if (e instanceof AppError) return { success: false, error: { code: e.code, message: e.message } }
      logger.error('Unhandled function error', { message: e.message, stack: e.stack })
      return { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } }
    }
  })
}

// Verifies auth + server-managed role claim + active account. Client-supplied roles are never read.
async function requireRole(req, ...roles) {
  if (!req.auth) throw E('UNAUTHENTICATED', 'Please sign in to continue.')
  const { role, profileId } = req.auth.token
  if (!role || (roles.length && !roles.includes(role))) throw E('PERMISSION_DENIED', 'You do not have permission to perform this action.')
  const u = await db.doc(`users/${req.auth.uid}`).get()
  if (!u.exists || u.data().status !== 'active') throw E('ACCOUNT_INACTIVE', 'This account is not active.')
  return { uid: req.auth.uid, role, profileId, name: u.data().name }
}

const bad = (m) => E('INVALID_ARGUMENT', m)
const v = {
  str(x, f, { min = 1, max = 200, optional = false } = {}) {
    if (x === undefined || x === null || x === '') { if (optional || min === 0) return ''; throw bad(`${f} is required.`) }
    if (typeof x !== 'string') throw bad(`${f} must be text.`)
    const s = x.trim()
    if (s.length < min || s.length > max) throw bad(`${f} must be between ${min} and ${max} characters.`)
    return s
  },
  num(x, f, { min = 0, max = 1e6 } = {}) {
    if (typeof x !== 'number' || !Number.isFinite(x) || x < min || x > max) throw bad(`${f} must be a number between ${min} and ${max}.`)
    return x
  },
  date(x, f) {
    if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x) || Number.isNaN(Date.parse(x + 'T00:00:00Z'))) throw bad(`${f} must be a valid date (YYYY-MM-DD).`)
    return x
  },
  time(x, f) { if (typeof x !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x)) throw bad(`${f} must be a time (HH:MM).`); return x },
  email(x, f = 'Email') { const s = v.str(x, f, { max: 120 }).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw bad(`${f} is not valid.`); return s },
  phone(x, f = 'Phone') { const s = v.str(x, f, { max: 20 }); if (!/^[+\d][\d\s-]{8,15}$/.test(s)) throw bad(`${f} is not valid.`); return s },
  oneOf(x, f, list) { if (!list.includes(x)) throw bad(`${f} must be one of: ${list.join(', ')}.`); return x },
  id(x, f) { if (typeof x !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(x)) throw bad(`${f} is not valid.`); return x },
  days(x) { if (!Array.isArray(x) || !x.length || x.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw bad('Select valid working days.'); return [...new Set(x)].sort() },
}

function auditSet(w, actor, action, resourceType, resourceId, metadata = {}) {
  w.set(db.collection('auditLogs').doc(), {
    actorId: actor.uid, actorRole: actor.role, actorName: actor.name || null, action, resourceType, resourceId,
    status: 'Success', metadata, timestamp: FieldValue.serverTimestamp(),
  })
}
// Deterministic id when `key` is given, so a retried operation cannot create duplicate notifications.
function notifySet(w, userId, { title, message, type, key }) {
  const ref = key ? db.collection('notifications').doc(`${userId}_${key}`) : db.collection('notifications').doc()
  w.set(ref, { notificationId: ref.id, userId, title, message, type, isRead: false, createdAt: FieldValue.serverTimestamp() })
}

// Simple per-user fixed-window limiter (abuse protection for expensive/privileged endpoints).
async function rateLimit(uid, key, max, windowSec) {
  const ref = db.doc(`rateLimits/${uid}_${key}`)
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref)
    const now = Date.now()
    const d = s.exists ? s.data() : { start: now, count: 0 }
    const fresh = now - d.start > windowSec * 1000
    const count = fresh ? 1 : d.count + 1
    if (count > max) throw E('RATE_LIMITED', 'Too many requests. Please wait a moment and try again.')
    tx.set(ref, { start: fresh ? now : d.start, count })
  })
}

const nextN = (snap, start) => (snap.exists ? snap.data().next : start)

module.exports = { admin, db, FieldValue, E, AppError, ok, handler, requireRole, v, auditSet, notifySet, rateLimit, nextN, logger }
