import { useEffect, useState } from 'react'
import { Avatar, Card, Field, PageHeader, Select, Spinner } from '../../components/common/index.jsx'

// Generic profile editor. fields: [{ key, label, type?, options?, readOnly?, validate?(v) }]
export default function ProfileForm({ title, subtitle, load, save, fields, onSaved }) {
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { load().then(setForm) }, []) // eslint-disable-line
  if (!form) return <Spinner />
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    fields.forEach((f) => { const msg = f.validate?.(form[f.key], form); if (msg) er[f.key] = msg })
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { const saved = await save(form); setForm(saved); onSaved?.(saved) } finally { setBusy(false) }
  }
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center"><Avatar name={form.name} size={80} /><p className="mt-3 font-semibold">{form.name}</p><p className="text-sm text-muted">{form.email}</p><p className="mt-1 text-xs text-muted">ID: {form.id}</p></Card>
        <Card title="Personal information" className="lg:col-span-2">
          <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} error={errors[f.key]} className={f.wide ? 'sm:col-span-2' : ''}>
                {f.options ? <Select value={form[f.key] ?? ''} onChange={(v) => setForm({ ...form, [f.key]: v })} options={f.options} placeholder="Select" />
                  : f.type === 'textarea' ? <textarea rows={3} className="input" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  : <input className="input disabled:bg-slate-50" type={f.type || 'text'} disabled={f.readOnly} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />}
              </Field>
            ))}
            <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </Card>
      </div>
    </>
  )
}
