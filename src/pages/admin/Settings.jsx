import { useEffect, useState } from 'react'
import { Card, Field, PageHeader, Spinner } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getSettings, saveSettings, exportData } from '../../services/adminService.js'
import { db } from '../../services/mock/db.js'
import { IS_MOCK } from '../../services/firebase.js'
import { isEmail, isPhone } from '../../utils/format.js'

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-3"><span><span className="block text-sm font-medium">{label}</span><span className="text-xs text-muted">{hint}</span></span>
    <input type="checkbox" className="h-5 w-5 accent-brand" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>
)

export default function Settings() {
  const { toast, confirm } = useApp()
  const [s, setS] = useState(null)
  const [errors, setErrors] = useState({})
  useEffect(() => { getSettings().then(setS) }, [])
  if (!s) return <Spinner />
  const set = (k, v) => setS({ ...s, [k]: v })
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (s.hospitalName.trim().length < 3) er.hospitalName = 'Enter the hospital name.'
    if (!isEmail(s.email)) er.email = 'Enter a valid email.'
    if (!isPhone(s.phone)) er.phone = 'Enter a valid phone number.'
    if (!(s.cancelWindowHours >= 0)) er.cancelWindowHours = 'Enter 0 or more hours.'
    setErrors(er)
    if (Object.keys(er).length) return
    await saveSettings(s); toast('Settings saved.')
  }
  const reset = async () => { if (await confirm({ title: 'Reset demo data', message: 'This restores all demo data and logs everyone out of their saved changes.' })) { db.reset(); localStorage.removeItem('MediCloud_session'); window.location.href = '/login' } }
  return (
    <>
      <PageHeader title="Settings" subtitle="Hospital profile and system preferences." />
      <form onSubmit={save} noValidate className="grid gap-6 lg:grid-cols-2">
        <Card title="Hospital profile"><div className="space-y-4">
          <Field label="Hospital name" error={errors.hospitalName}><input className="input" value={s.hospitalName} onChange={(e) => set('hospitalName', e.target.value)} /></Field>
          <Field label="Contact email" error={errors.email}><input className="input" value={s.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone" error={errors.phone}><input className="input" value={s.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Address"><textarea rows={2} className="input" value={s.address} onChange={(e) => set('address', e.target.value)} /></Field></div></Card>
        <Card title="System settings"><div className="divide-y divide-slate-100">
          <Toggle label="Online appointment booking" hint="Allow patients to book through the portal" checked={s.onlineBooking} onChange={(v) => set('onlineBooking', v)} />
          <Toggle label="Email alerts" hint="Send alerts for new bookings and cancellations" checked={s.emailAlerts} onChange={(v) => set('emailAlerts', v)} /></div>
          <Field className="mt-4" label="Cancellation window (hours before appointment)" error={errors.cancelWindowHours}><input type="number" min="0" className="input" value={s.cancelWindowHours} onChange={(e) => set('cancelWindowHours', Number(e.target.value))} /></Field></Card>
        <div className="flex flex-wrap gap-3 lg:col-span-2"><button className="btn btn-primary">Save settings</button><button type="button" className="btn btn-ghost" onClick={async () => { const r = await exportData(); toast(`Backup downloaded: ${r.fileName}`) }}>Download data backup (JSON)</button>
          {IS_MOCK && <button type="button" className="btn btn-ghost text-danger" onClick={reset}>Reset demo data</button>}</div>
      </form>
    </>
  )
}
