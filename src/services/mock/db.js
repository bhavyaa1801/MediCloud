// Mock persistence layer (localStorage). Replace with Firestore in Phase 2.
import seed from '../../data/seed.js'

const KEY = 'MediCloud_db_v2'
let cache = null
const load = () => {
  if (cache) return cache
  try { const raw = localStorage.getItem(KEY); cache = raw ? JSON.parse(raw) : seed() } catch { cache = seed() }
  localStorage.setItem(KEY, JSON.stringify(cache))
  return cache
}
const save = () => localStorage.setItem(KEY, JSON.stringify(cache))

export const db = {
  all: (t) => load()[t],
  get: (t, id) => load()[t]?.find((x) => x.id === id) ?? null,
  insert: (t, item) => { load()[t].unshift(item); save(); return item },
  update: (t, id, patch) => {
    const row = load()[t].find((x) => x.id === id)
    if (!row) throw new Error('Record not found')
    Object.assign(row, patch); save(); return row
  },
  setObject: (t, v) => { load()[t] = v; save() },
  dump: () => structuredClone(load()),
  reset: () => { localStorage.removeItem(KEY); cache = null; load() },
}

export const resolve = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 100))
export const uid = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`
export const nextId = (table, prefix, start) => {
  const nums = db.all(table).map((x) => parseInt(x.id.split('-')[1], 10)).filter(Number.isFinite)
  return `${prefix}-${nums.length ? Math.max(...nums) + 1 : start}`
}
export const logAudit = (actor, action, resource, status = 'Success') =>
  db.insert('audit', { id: uid('LOG'), actor, action, resource, status, timestamp: new Date().toISOString() })
export const pushNotification = (userId, title, message, type) =>
  db.insert('notifications', { id: uid('NTF'), userId, title, message, type, read: false, createdAt: new Date().toISOString() })
