import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Card, Field, PageHeader, Select } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctors, getDepartments } from '../../services/doctorService.js'
import { getAvailableSlots, bookAppointment } from '../../services/appointmentService.js'
import { isWorkingDate, todayISO } from '../../utils/schedule.js'
import { fmtDate, fmtTime, money } from '../../utils/format.js'

export default function BookAppointment({ patientId, appointmentsPath = '/patient/appointments', embedded = false } = {}) {
  const { user } = useAuth()
  const { toast } = useApp()
  const [params] = useSearchParams()
  const { data: doctors } = useData(getDoctors, [], [])
  const { data: depts } = useData(getDepartments, [], [])
  const [f, setF] = useState({ dept: '', doctor: params.get('doctor') || '', date: params.get('date') || '', time: '', reason: '' })
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  const { data: slots, reload } = useData(() => getAvailableSlots(f.doctor, f.date), [f.doctor, f.date], [])
  const doc = doctors.find((d) => d.id === f.doctor)
  useEffect(() => { if (doc && !f.dept) setF((x) => ({ ...x, dept: doc.departmentId })) }, [doc]) // eslint-disable-line
  const options = doctors.filter((d) => d.status === 'active' && (!f.dept || d.departmentId === f.dept))
  const dateOk = f.date && doc && isWorkingDate(doc, f.date)

  const confirm = async () => {
    setBusy(true)
    try { setDone(await bookAppointment({ patientId: patientId || user.profileId, doctorId: f.doctor, date: f.date, time: f.time, reason: f.reason })); toast('Appointment booked successfully.') }
    catch (e) { toast(e.message, 'error'); setF((x) => ({ ...x, time: '' })); reload() } finally { setBusy(false) }
  }
  if (done) return (
    <Card className="mx-auto max-w-lg text-center"><CheckCircle2 size={48} className="mx-auto text-success" /><h1 className="mt-3 text-xl font-semibold">Appointment requested</h1>
      <p className="mt-1 text-sm text-muted">Your booking is pending confirmation by the doctor.</p>
      <div className="mt-5 space-y-1 rounded-xl bg-surface p-4 text-left text-sm"><p><b>ID:</b> {done.id}</p><p><b>Doctor:</b> {done.doctorName}</p><p><b>When:</b> {fmtDate(done.date)} at {fmtTime(done.time)}</p></div>
      <div className="mt-5 flex justify-center gap-2"><Link to={appointmentsPath} className="btn btn-primary">View appointments</Link><button className="btn btn-ghost" onClick={() => { setDone(null); setF({ dept: '', doctor: '', date: '', time: '', reason: '' }) }}>Book another</button></div></Card>
  )
  return (
    <>
      {!embedded && <PageHeader title="Book Appointment" subtitle="Choose a department, doctor, date and time." />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="1. Department & doctor"><div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department"><Select value={f.dept} onChange={(v) => setF({ ...f, dept: v, doctor: '', time: '' })} placeholder="All departments" options={depts.map((d) => ({ value: d.id, label: d.name }))} /></Field>
            <Field label="Doctor"><Select value={f.doctor} onChange={(v) => setF({ ...f, doctor: v, time: '' })} placeholder="Select doctor" options={options.map((d) => ({ value: d.id, label: `${d.name} — ${d.specialization}` }))} /></Field></div></Card>
          <Card title="2. Date">
            <input type="date" className="input max-w-xs" min={todayISO()} value={f.date} disabled={!f.doctor} onChange={(e) => setF({ ...f, date: e.target.value, time: '' })} />
            {f.date && doc && !dateOk && <p className="mt-2 text-sm text-danger">{doc.name} is not available on this date. Please choose another day.</p>}</Card>
          <Card title="3. Time slot">
            {!dateOk ? <p className="text-sm text-muted">Select a doctor and an available date to see time slots.</p> : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">{slots.map((s) => (
                <button key={s.time} disabled={s.booked} onClick={() => setF({ ...f, time: s.time })} className={`rounded-lg border px-2 py-2 text-sm transition ${s.booked ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 line-through' : f.time === s.time ? 'border-brand bg-brand text-white' : 'border-slate-200 hover:border-brand'}`}>{fmtTime(s.time)}</button>))}</div>)}</Card>
          <Card title="4. Reason for visit"><textarea rows={3} className="input" placeholder="Briefly describe your symptoms or reason (optional)" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Card>
        </div>
        <Card title="Booking summary" className="h-fit lg:sticky lg:top-0">
          <dl className="space-y-3 text-sm">{[['Doctor', doc?.name], ['Department', doc?.departmentName], ['Date', f.date && dateOk ? fmtDate(f.date) : null], ['Time', f.time ? fmtTime(f.time) : null], ['Fee', doc ? money(doc.fee) : null]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v || '—'}</dd></div>)}</dl>
          <button className="btn btn-primary mt-5 w-full" disabled={!f.time || busy} onClick={confirm}>{busy ? 'Booking…' : 'Confirm appointment'}</button></Card>
      </div>
    </>
  )
}
