import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { Field } from '../../components/common/index.jsx'
import { isEmail } from '../../utils/format.js'
import { sendReset } from '../../services/authService.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const submit = async (e) => { e.preventDefault(); if (!isEmail(email)) return setError('Enter a valid email address.'); setError(''); try { await sendReset(email); setSent(true) } catch (err) { setError(err.message) } }
  return (
    <AuthShell title="Reset your password" subtitle="We’ll send reset instructions to your email.">
      {sent ? (
        <div className="text-center"><MailCheck className="mx-auto mb-3 text-success" size={40} /><p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">If an account exists for {email}, reset instructions are on their way. </p></div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={error}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <button className="btn btn-primary w-full">Send reset link</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-medium text-brand">Back to login</Link></p>
    </AuthShell>
  )
}
