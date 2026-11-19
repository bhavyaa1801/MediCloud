// DEVELOPMENT-ONLY mock authentication. Not secure; replace with Firebase Auth.
import { db, resolve, nextId, logAudit } from './db.js'

export const DEMO_PASSWORD = 'demo1234'
export const DEMO_ACCOUNTS = { patient: 'patient@MediCloud.demo', doctor: 'doctor@MediCloud.demo', receptionist: 'reception@MediCloud.demo', admin: 'admin@MediCloud.demo' }
const KEY = 'MediCloud_session'
const toSession = (u) => ({ userId: u.id, profileId: u.profileId, role: u.role, name: u.name, email: u.email })
const start = (u) => { const s = toSession(u); localStorage.setItem(KEY, JSON.stringify(s)); return s }
export const saveSession = (s) => localStorage.setItem(KEY, JSON.stringify(s))
export const init = (cb) => { try { cb(JSON.parse(localStorage.getItem(KEY))) } catch { cb(null) } return () => {} }
export const logout = async () => localStorage.removeItem(KEY)
export const sendReset = async () => true

export async function login(email, password) {
  const user = db.all('users').find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || password !== DEMO_PASSWORD) {
    logAudit('Unknown user', 'Failed login attempt', email, 'Failed')
    throw new Error('Invalid email or password.')
  }
  if (user.status !== 'active') throw new Error('This account has been deactivated. Contact the hospital.')
  return resolve(start(user))
}
export const loginAs = (role) => login(DEMO_ACCOUNTS[role], DEMO_PASSWORD)

export async function registerPatient(data) {
  if (db.all('users').some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase()))
    throw new Error('An account with this email already exists.')
  const id = nextId('patients', 'PT', 1001)
  const patient = { id, name: data.name.trim(), email: data.email.trim(), phone: data.phone, dob: data.dob, gender: data.gender,
    bloodGroup: '', address: '', emergencyContact: '', registeredOn: new Date().toISOString().slice(0, 10), status: 'active' }
  db.insert('patients', patient)
  const user = db.insert('users', { id: `u-${id}`, profileId: id, name: patient.name, email: patient.email, role: 'patient', status: 'active' })
  logAudit(patient.name, 'Registered account', id)
  return resolve(start(user))
}
