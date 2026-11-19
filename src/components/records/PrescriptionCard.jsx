import { Pill } from 'lucide-react'
import { fmtDate } from '../../utils/format.js'

export default function PrescriptionCard({ rx, party = 'doctor', onView }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Pill size={18} /></div>
          <div><p className="font-medium">{party === 'doctor' ? rx.doctorName : rx.patientName}</p><p className="text-xs text-muted">{rx.id} · {fmtDate(rx.date)}</p></div></div>
        <button className="btn btn-ghost btn-sm" onClick={() => onView(rx)}>View details</button>
      </div>
      <ul className="space-y-1 text-sm">{rx.medicines.map((m, i) => <li key={i} className="flex justify-between gap-2 rounded-lg bg-surface px-3 py-2"><span className="font-medium">{m.name} <span className="font-normal text-muted">{m.dosage}</span></span><span className="text-muted">{m.frequency} · {m.duration}</span></li>)}</ul>
    </div>
  )
}

export function PrescriptionDetail({ rx }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-muted">Doctor</p><p>{rx.doctorName}</p></div><div><p className="text-xs text-muted">Patient</p><p>{rx.patientName}</p></div><div><p className="text-xs text-muted">Consultation date</p><p>{fmtDate(rx.date)}</p></div><div><p className="text-xs text-muted">Prescription ID</p><p>{rx.id}</p></div></div>
      {rx.medicines.map((m, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold">{m.name}</p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted"><span>Dosage: <b className="text-ink">{m.dosage}</b></span><span>Frequency: <b className="text-ink">{m.frequency}</b></span><span>Duration: <b className="text-ink">{m.duration}</b></span></div>
          {m.instructions && <p className="mt-2 text-xs">Instructions: {m.instructions}</p>}</div>
      ))}
      {rx.notes && <p className="text-xs text-muted">Notes: {rx.notes}</p>}
    </div>
  )
}
