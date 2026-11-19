import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Pill } from 'lucide-react'
import { Avatar, Card, EmptyState, Modal, Spinner, StatusBadge } from '../../components/common/index.jsx'
import RecordPreview from '../../components/records/RecordPreview.jsx'
import { PrescriptionDetail } from '../../components/records/PrescriptionCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPatient } from '../../services/patientService.js'
import { getDoctorAppointments } from '../../services/appointmentService.js'
import { getRecords, getPrescriptions } from '../../services/recordService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'

export default function PatientDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const doc = user.profileId
  const { data: p, loading } = useData(() => getPatient(id), [id])
  const { data: appts } = useData(async () => (await getDoctorAppointments(doc)).filter((a) => a.patientId === id), [id, doc], [])
  // Authorized history = only what this doctor created for the patient.
  const { data: recs } = useData(() => getRecords({ patientId: id, doctorId: doc }), [id, doc], [])
  const { data: rx } = useData(() => getPrescriptions({ patientId: id, doctorId: doc }), [id, doc], [])
  const [rec, setRec] = useState(null)
  const [rxView, setRxView] = useState(null)
  if (loading) return <Spinner />
  if (!p) return <EmptyState title="Patient not found" />
  const info = [['Patient ID', p.id], ['Gender', p.gender], ['Date of birth', fmtDate(p.dob)], ['Blood group', p.bloodGroup || '—'], ['Phone', p.phone], ['Email', p.email], ['Emergency contact', p.emergencyContact || '—']]
  return (
    <>
      <Link to="/doctor/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"><ArrowLeft size={14} />Back to patients</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit"><div className="flex items-center gap-3"><Avatar name={p.name} size={56} /><div><h1 className="text-lg font-semibold">{p.name}</h1><StatusBadge status={p.status} /></div></div>
          <dl className="mt-5 space-y-2 text-sm">{info.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
          <Link to={`/doctor/prescriptions?patient=${p.id}`} className="btn btn-primary mt-5 w-full"><Pill size={16} />Write prescription</Link></Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title="Appointment history">{appts.length === 0 ? <EmptyState title="No appointments" /> : appts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0"><div><p className="font-medium">{fmtDate(a.date)} · {fmtTime(a.time)}</p><p className="text-xs text-muted">{a.reason}</p></div><div className="flex items-center gap-2"><StatusBadge status={a.status} />{a.status !== 'Cancelled' && <Link to={`/doctor/consult/${a.id}`} className="btn btn-ghost btn-sm">Consult</Link>}</div></div>))}</Card>
          <Card title="Medical history & uploaded reports">{recs.length === 0 ? <EmptyState title="No records from you yet" /> : recs.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"><div><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.type} · {fmtDate(r.date)}</p></div><button className="btn btn-ghost btn-sm" onClick={() => setRec(r)}><Eye size={14} />View</button></div>))}</Card>
          <Card title="Previous prescriptions">{rx.length === 0 ? <EmptyState title="No prescriptions" /> : rx.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"><div><p className="font-medium">{r.medicines.map((m) => m.name).join(', ')}</p><p className="text-xs text-muted">{r.id} · {fmtDate(r.date)}</p></div><button className="btn btn-ghost btn-sm" onClick={() => setRxView(r)}>Details</button></div>))}</Card>
        </div>
      </div>
      <RecordPreview record={rec} onClose={() => setRec(null)} />
      <Modal open={!!rxView} onClose={() => setRxView(null)} title="Prescription details" wide>{rxView && <PrescriptionDetail rx={rxView} />}</Modal>
    </>
  )
}
