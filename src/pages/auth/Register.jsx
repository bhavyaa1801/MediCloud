import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell.jsx'
import { Field, Select } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { isEmail, isPhone } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export default function Register() {
  const { register } = useAuth()
  const { toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', dob: '', gender: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (f.name.trim().length < 3) er.name = 'Enter your full name.'
    if (!isEmail(f.email)) er.email = 'Enter a valid email address.'
    if (!isPhone(f.phone)) er.phone = 'Enter a valid phone number.'
    if (f.password.length < 8) er.password = 'Use at least 8 characters.'
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match.'
    if (!f.dob || f.dob > todayISO()) er.dob = 'Select a valid date of birth.'
    if (!f.gender) er.gender = 'Select a gender.'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { await register(f); toast('Account created. Welcome to MediCloud!'); nav('/patient') }
    catch (err) { setErrors({ form: err.message }) } finally { setBusy(false) }
  }
  return (
    <AuthShell wide title="Create patient account" subtitle="Doctor and administrator accounts are created by the hospital.">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errors.form && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger sm:col-span-2">{errors.form}</p>}
        <Field className="sm:col-span-2" label="Full name" error={errors.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errors.email}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone number" error={errors.phone}><input className="input" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></Field>
        <Field label="Password" error={errors.password}><input className="input" type="password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Confirm password" error={errors.confirm}><input className="input" type="password" value={f.confirm} onChange={set('confirm')} /></Field>
        <Field label="Date of birth" error={errors.dob}><input className="input" type="date" max={todayISO()} value={f.dob} onChange={set('dob')} /></Field>
        <Field label="Gender" error={errors.gender}><Select value={f.gender} onChange={(v) => setF({ ...f, gender: v })} options={['Female', 'Male', 'Other']} placeholder="Select" /></Field>
        <button className="btn btn-primary sm:col-span-2" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already registered? <Link to="/login" className="font-medium text-brand">Login</Link></p>
    </AuthShell>
  )
}
