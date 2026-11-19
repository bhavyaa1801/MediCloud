import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, EmptyState, Field, PageHeader, Spinner, StatusBadge } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getAppointment, saveConsultation } from '../../services/appointmentService.js'
import { getPatient } from '../../services/patientService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'

export default function Consultation() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useApp()
  const nav = useNavigate()
  const { data: a, loading } = useData(() => getAppointment(id), [id])
  const { data: p } = useData(() => (a ? getPatient(a.patientId) : Promise.resolve(null)), [a?.patientId])
  const [f, setF] = useState({ symptoms: '', diagnosis: '', notes: '', followUp: '' })
  const [done, setDone] = useState(true)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (a) setF({ symptoms: a.consultation?.symptoms ?? a.reason, diagnosis: a.consultation?.diagnosis ?? '', notes: a.consultation?.notes ?? '', followUp: a.consultation?.followUp ?? '' }) }, [a])
  if (loading) return <Spinner />
  if (!a || a.doctorId !== user.profileId) return <EmptyState title="Appointment not found" />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.symptoms.trim()) er.symptoms = 'Enter symptoms or reason for visit.'
    if (!f.diagnosis.trim()) er.diagnosis = 'Enter a diagnosis.'
    if (f.notes.trim().length < 10) er.notes = 'Add consultation notes (at least 10 characters).'
    setErrors(er)
    if (Object.keys(er).length) return
    await saveConsultation(id, f, done, user.name)
    toast('Consultation saved.'); nav('/doctor/appointments')
  }
  return (
    <>
      <Link to="/doctor/appointments" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"><ArrowLeft size={14} />Back to appointments</Link>
      <PageHeader title="Consultation" subtitle={`${a.id} · ${fmtDate(a.date)} at ${fmtTime(a.time)}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Patient & appointment" className="h-fit"><dl className="space-y-2 text-sm">
          {[['Patient', a.patientName], ['Patient ID', a.patientId], ['Gender', p?.gender], ['Blood group', p?.bloodGroup || '—'], ['Phone', p?.phone], ['Department', a.departmentName]].map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><StatusBadge status={a.status} /></dd></div></dl></Card>
        <Card title="Consultation notes" className="lg:col-span-2"><form onSubmit={save} noValidate className="space-y-4">
          <Field label="Symptoms / reason for visit" error={errors.symptoms}><textarea rows={2} className="input" value={f.symptoms} onChange={set('symptoms')} /></Field>
          <Field label="Diagnosis" error={errors.diagnosis}><input className="input" value={f.diagnosis} onChange={set('diagnosis')} /></Field>
          <Field label="Consultation notes" error={errors.notes}><textarea rows={4} className="input" value={f.notes} onChange={set('notes')} /></Field>
          <Field label="Follow-up instructions"><textarea rows={2} className="input" value={f.followUp} onChange={set('followUp')} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />Mark appointment as completed</label>
          <button className="btn btn-primary">Save Consultation</button></form></Card>
      </div>
    </>
  )
}
