import { useEffect, useState } from 'react'
import { Plus, Eye, Pencil, Power } from 'lucide-react'
import { DataTable, Field, Modal, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPatients, addPatient, updatePatient } from '../../services/patientService.js'
import { fmtDate, isEmail, isPhone } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

const blank = { name: '', email: '', phone: '', dob: '', gender: '' }

export default function Patients({ canDeactivate = true } = {}) {
  const { toast, confirm } = useApp()
  const { data, reload } = useData(getPatients, [], [])
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null) // null | { mode, values }
  const [view, setView] = useState(null)
  const [errors, setErrors] = useState({})
  const rows = data.filter((p) => !status || p.status === status)
  useEffect(() => setErrors({}), [form])

  const submit = async (e) => {
    e.preventDefault()
    const v = form.values, er = {}
    if (v.name.trim().length < 3) er.name = 'Enter a full name.'
    if (!isEmail(v.email)) er.email = 'Enter a valid email.'
    if (!isPhone(v.phone)) er.phone = 'Enter a valid phone number.'
    if (!v.dob || v.dob > todayISO()) er.dob = 'Select a valid date.'
    if (!v.gender) er.gender = 'Select a gender.'
    setErrors(er)
    if (Object.keys(er).length) return
    try {
      if (form.mode === 'add') await addPatient(v); else await updatePatient(v.id, { name: v.name, phone: v.phone, dob: v.dob, gender: v.gender }, 'Hospital Admin')
      toast(form.mode === 'add' ? 'Patient added.' : 'Patient updated.'); setForm(null); reload()
    } catch (err) { setErrors({ email: err.message }) }
  }
  const toggle = async (p) => {
    const next = p.status === 'active' ? 'inactive' : 'active'
    if (!(await confirm({ title: `${next === 'inactive' ? 'Deactivate' : 'Activate'} account`, message: `${next === 'inactive' ? 'Deactivate' : 'Activate'} ${p.name}'s account?`, danger: next === 'inactive', confirmText: next === 'inactive' ? 'Deactivate' : 'Activate' }))) return
    await updatePatient(p.id, { status: next }, 'Hospital Admin'); toast(`Account ${next === 'active' ? 'activated' : 'deactivated'}.`); reload()
  }
  const set = (k) => (e) => setForm({ ...form, values: { ...form.values, [k]: e.target.value } })
  return (
    <>
      <PageHeader title="Patients" subtitle="Manage registered patients." actions={<button className="btn btn-primary" onClick={() => setForm({ mode: 'add', values: blank })}><Plus size={16} />Add patient</button>} />
      <DataTable rows={rows} searchKeys={['name', 'id', 'email', 'phone']} toolbar={<Select className="w-40" value={status} onChange={setStatus} placeholder="All statuses" options={['active', 'inactive']} />} columns={[
        { label: 'Patient ID', key: 'id' }, { label: 'Name', render: (p) => <span className="font-medium">{p.name}</span> }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
        { label: 'Registered', render: (p) => fmtDate(p.registeredOn) }, { label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
        { label: 'Actions', render: (p) => <div className="flex gap-1.5"><button className="btn btn-ghost btn-sm" title="View" onClick={() => setView(p)}><Eye size={14} /></button><button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setForm({ mode: 'edit', values: p })}><Pencil size={14} /></button>{canDeactivate && <button className="btn btn-ghost btn-sm" title="Activate / deactivate" onClick={() => toggle(p)}><Power size={14} /></button>}</div> },
      ]} />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'add' ? 'Add patient' : 'Edit patient'} wide>
        {form && <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}><input className="input" value={form.values.name} onChange={set('name')} /></Field>
          <Field label="Email" error={errors.email}><input className="input disabled:bg-slate-50" disabled={form.mode === 'edit'} value={form.values.email} onChange={set('email')} /></Field>
          <Field label="Phone" error={errors.phone}><input className="input" value={form.values.phone} onChange={set('phone')} /></Field>
          <Field label="Date of birth" error={errors.dob}><input type="date" className="input" value={form.values.dob} onChange={set('dob')} /></Field>
          <Field label="Gender" error={errors.gender}><Select value={form.values.gender} onChange={(v) => setForm({ ...form, values: { ...form.values, gender: v } })} options={['Female', 'Male', 'Other']} placeholder="Select" /></Field>
          <div className="flex items-end justify-end gap-2 sm:col-span-2"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary">Save</button></div>
        </form>}
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} title="Patient details">
        {view && <dl className="space-y-2 text-sm">{[['Patient ID', view.id], ['Name', view.name], ['Email', view.email], ['Phone', view.phone], ['Gender', view.gender], ['Date of birth', fmtDate(view.dob)], ['Blood group', view.bloodGroup || '—'], ['Address', view.address || '—'], ['Registered', fmtDate(view.registeredOn)]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}<div className="flex justify-between"><dt className="text-muted">Status</dt><dd><StatusBadge status={view.status} /></dd></div></dl>}
      </Modal>
    </>
  )
}
