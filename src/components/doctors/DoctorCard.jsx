import { Link } from 'react-router-dom'
import { Briefcase, Building2 } from 'lucide-react'
import { Avatar } from '../common/index.jsx'
import { money } from '../../utils/format.js'
import { DAYS, isWorkingDate, todayISO } from '../../utils/schedule.js'

export const availabilityLabel = (d) => {
  if (d.status !== 'active') return { text: 'Unavailable', ok: false }
  if (isWorkingDate(d, todayISO())) return { text: 'Available today', ok: true }
  return { text: `Next: ${d.workingDays.map((x) => DAYS[x]).join(', ')}`, ok: false }
}

export default function DoctorCard({ doctor }) {
  const a = availabilityLabel(doctor)
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-3"><Avatar name={doctor.name} size={52} />
        <div className="min-w-0"><p className="truncate font-semibold">{doctor.name}</p><p className="truncate text-sm text-brand">{doctor.specialization}</p></div></div>
      <div className="mt-4 space-y-1.5 text-sm text-muted">
        <p className="flex items-center gap-2"><Building2 size={14} />{doctor.departmentName}</p>
        <p className="flex items-center gap-2"><Briefcase size={14} />{doctor.experience} years experience</p>
        <p className="flex justify-between"><span>Consultation fee</span><b className="text-ink">{money(doctor.fee)}</b></p>
      </div>
      <span className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${a.ok ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-600'}`}>{a.text}</span>
      <div className="mt-4 flex gap-2"><Link to={`/patient/doctors/${doctor.id}`} className="btn btn-ghost flex-1">View Profile</Link><Link to={`/patient/book?doctor=${doctor.id}`} className="btn btn-primary flex-1">Book</Link></div>
    </div>
  )
}
