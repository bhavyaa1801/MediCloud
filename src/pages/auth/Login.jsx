import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserRound, Stethoscope, ShieldCheck, ClipboardList } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { Field } from '../../components/common/index.jsx'
import { useAuth, homeFor } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { isEmail } from '../../utils/format.js'
import { IS_MOCK } from '../../services/firebase.js'

export default function Login() {
  const { user, loading, login, loginAs } = useAuth()
  const { toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '', remember: true })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  if (loading) return null
  if (user) return <Navigate to={homeFor(user.role)} replace />

  const run = async (fn) => {
    setBusy(true)
    try { const s = await fn(); toast(`Welcome back, ${s.name}!`); nav(homeFor(s.role)) }
    catch (e) { setErrors({ form: e.message }) } finally { setBusy(false) }
  }
  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (!isEmail(f.email)) er.email = 'Enter a valid email address.'
    if (f.password.length < 6) er.password = 'Password must be at least 6 characters.'
    setErrors(er)
    if (!Object.keys(er).length) run(() => login(f.email, f.password))
  }
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your MediCloud account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.form && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{errors.form}</p>}
        <Field label="Email" error={errors.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" /></Field>
        <Field label="Password" error={errors.password}>
          <div className="relative"><input className="input pr-10" type={show ? 'text' : 'password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} />Remember me</label>
          <Link to="/forgot-password" className="text-brand hover:underline">Forgot password?</Link>
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
      </form>
      {IS_MOCK && <div className="mt-6 rounded-xl border border-dashed border-warning/60 bg-warning/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Development only — demo login</p>
        <p className="mb-3 mt-1 text-xs text-muted">Mock authentication for demonstration. Password for demo accounts: <code>demo1234</code>.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['patient', 'Patient', UserRound], ['doctor', 'Doctor', Stethoscope], ['receptionist', 'Reception', ClipboardList], ['admin', 'Admin', ShieldCheck]].map(([r, l, I]) => (
            <button key={r} disabled={busy} onClick={() => run(() => loginAs(r))} className="btn btn-ghost flex-col gap-1 py-3 text-xs"><I size={18} className="text-brand" />{l}</button>
          ))}
        </div>
      </div>}
      {!IS_MOCK && <p className="mt-5 rounded-lg bg-surface p-3 text-xs text-muted">Doctors, receptionists and administrators: sign in here with the credentials issued by the hospital. You will be taken to your own dashboard automatically. Accounts for these roles cannot be created from the sign-up page.</p>}
      <p className="mt-6 text-center text-sm text-muted">New patient? <Link to="/register" className="font-medium text-brand">Create an account</Link></p>
    </AuthShell>
  )
}
