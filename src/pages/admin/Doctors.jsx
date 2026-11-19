import { useEffect, useState } from 'react'
import { Plus, Pencil, Power, CalendarClock } from 'lucide-react'
import { Avatar, DataTable, Field, Modal, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctors, getDepartments, addDoctor, updateDoctor } from '../../services/doctorService.js'
import { DAYS } from '../../utils/schedule.js'
import { IS_MOCK } from '../../services/firebase.js'
import { fmtTime, isEmail, isPhone, money } from '../../utils/format.js'

const blank = { name: 'Dr. ', email: '', phone: '', departmentId: '', specialization: '', qualifications: '', experience: 5, fee: 500, start: '09:00', end: '17:00', workingDays: [1, 2, 3, 4, 5] }

export default function Doctors() {
  const { toast, confirm } = useApp()
  const { data, reload } = useData(getDoctors, [], [])
  const { data: depts } = useData(getDepartments, [], [])
  const [dept, setDept] = useState('')
  const [form, setForm] = useState(null)
  const [avail, setAvail] = useState(null)
  const [errors, setErrors] = useState({})
  useEffect(() => setErrors({}), [form])
  const v = form?.values
  const set = (k, val) => setForm({ ...form, values: { ...v, [k]: val } })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (v.name.trim().length < 6) er.name = 'Enter the doctor’s full name.'
    if (!isEmail(v.email)) er.email = 'Enter a valid email.'
    if (!isPhone(v.phone)) er.phone = 'Enter a valid phone number.'
    if (!v.departmentId) er.departmentId = 'Assign a department.'
    if (!v.specialization.trim()) er.specialization = 'Required.'
    if (!v.qualifications.trim()) er.qualifications = 'Required.'
    if (!(v.fee > 0)) er.fee = 'Enter a valid fee.'
    if (v.start >= v.end) er.end = 'End must be after start.'
    if (!v.workingDays.length) er.days = 'Select working days.'
    setErrors(er)
    if (Object.keys(er).length) return
    try {
      const { departmentName, ...clean } = v
      if (form.mode === 'add') await addDoctor(clean); else await updateDoctor(v.id, clean)
      toast(form.mode === 'add' ? 'Doctor added to the directory.' : 'Doctor updated.'); setForm(null); reload()
    } catch (err) { setErrors({ email: err.message }) }
  }
  const toggle = async (d) => {
    const next = d.status === 'active' ? 'inactive' : 'active'
    if (!(await confirm({ title: `${next === 'inactive' ? 'Deactivate' : 'Activate'} doctor`, message: `${next === 'inactive' ? 'Deactivating hides' : 'Activating shows'} ${d.name} ${next === 'inactive' ? 'from' : 'in'} patient booking.`, danger: next === 'inactive' }))) return
    await updateDoctor(d.id, { status: next }); toast(`Doctor ${next === 'active' ? 'activated' : 'deactivated'}.`); reload()
  }
  return (
    <>
      <PageHeader title="Doctors" subtitle="Manage the doctor directory." actions={<button className="btn btn-primary" onClick={() => setForm({ mode: 'add', values: blank })}><Plus size={16} />Add doctor</button>} />
      <DataTable rows={data.filter((d) => !dept || d.departmentId === dept)} searchKeys={['name', 'specialization', 'email', 'id']} toolbar={<Select className="w-52" value={dept} onChange={setDept} placeholder="All departments" options={depts.map((d) => ({ value: d.id, label: d.name }))} />} columns={[
        { label: 'Doctor', render: (d) => <div className="flex items-center gap-3"><Avatar name={d.name} size={32} /><div><p className="font-medium">{d.name}</p><p className="text-xs text-muted">{d.id}</p></div></div> },
        { label: 'Specialization', key: 'specialization' }, { label: 'Department', key: 'departmentName' }, { label: 'Fee', render: (d) => money(d.fee) },
        { label: 'Status', render: (d) => <StatusBadge status={d.status} /> },
        { label: 'Actions', render: (d) => <div className="flex gap-1.5"><button className="btn btn-ghost btn-sm" title="Availability" onClick={() => setAvail(d)}><CalendarClock size={14} /></button><button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setForm({ mode: 'edit', values: d })}><Pencil size={14} /></button><button className="btn btn-ghost btn-sm" title="Activate / deactivate" onClick={() => toggle(d)}><Power size={14} /></button></div> },
      ]} />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'add' ? 'Add doctor' : 'Edit doctor'} wide>
        {form && <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name}><input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Email" error={errors.email}><input className="input disabled:bg-slate-50" disabled={form.mode === 'edit' && !IS_MOCK} value={v.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone" error={errors.phone}><input className="input" value={v.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Department" error={errors.departmentId}><Select value={v.departmentId} onChange={(x) => set('departmentId', x)} placeholder="Select" options={depts.map((d) => ({ value: d.id, label: d.name }))} /></Field>
          <Field label="Specialization" error={errors.specialization}><input className="input" value={v.specialization} onChange={(e) => set('specialization', e.target.value)} /></Field>
          <Field label="Qualifications" error={errors.qualifications}><input className="input" value={v.qualifications} onChange={(e) => set('qualifications', e.target.value)} /></Field>
          <Field label="Experience (years)"><input type="number" min="0" className="input" value={v.experience} onChange={(e) => set('experience', Number(e.target.value))} /></Field>
          <Field label="Consultation fee (₹)" error={errors.fee}><input type="number" min="0" className="input" value={v.fee} onChange={(e) => set('fee', Number(e.target.value))} /></Field>
          <Field label="Working hours — start"><input type="time" className="input" value={v.start} onChange={(e) => set('start', e.target.value)} /></Field>
          <Field label="Working hours — end" error={errors.end}><input type="time" className="input" value={v.end} onChange={(e) => set('end', e.target.value)} /></Field>
          <div className="sm:col-span-2"><label className="label">Working days</label><div className="flex flex-wrap gap-2">{DAYS.map((n, i) => <button type="button" key={n} onClick={() => set('workingDays', v.workingDays.includes(i) ? v.workingDays.filter((x) => x !== i) : [...v.workingDays, i].sort())} className={`h-9 w-12 rounded-lg border text-sm ${v.workingDays.includes(i) ? 'border-brand bg-brand text-white' : 'border-slate-200 text-muted'}`}>{n}</button>)}</div>{errors.days && <p className="mt-1 text-xs text-danger">{errors.days}</p>}</div>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary">Save doctor</button></div>
        </form>}
      </Modal>
      <Modal open={!!avail} onClose={() => setAvail(null)} title="Doctor availability">
        {avail && <div className="space-y-3 text-sm"><p className="font-semibold">{avail.name}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">{DAYS.map((n, i) => <div key={n} className={`rounded-lg py-2 ${avail.workingDays.includes(i) ? 'bg-brand/10 font-medium text-brand' : 'bg-slate-50 text-slate-400'}`}>{n}</div>)}</div>
          <p>Hours: {fmtTime(avail.start)} – {fmtTime(avail.end)} (break {fmtTime(avail.breakStart)} – {fmtTime(avail.breakEnd)})</p><p>Slot length: {avail.slotMinutes} minutes</p><p>Blocked dates: {avail.blockedDates.length ? avail.blockedDates.join(', ') : 'None'}</p></div>}
      </Modal>
    </>
  )
}
