import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Users, Stethoscope, UserPlus, CalendarPlus } from 'lucide-react'
import { Card, EmptyState, Spinner, StatCard, StatusBadge } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService.js'
import { getPatients } from '../../services/patientService.js'
import { getDoctors } from '../../services/doctorService.js'
import { fmtTime } from '../../utils/format.js'
import { isWorkingDate, todayISO } from '../../utils/schedule.js'

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useApp()
  const { data: appts, loading, reload } = useData(getAppointments, [], [], ['appointments'])
  const { data: patients } = useData(getPatients, [], [])
  const { data: doctors } = useData(getDoctors, [], [], ['doctors'])
  if (loading) return <Spinner />
  const t = todayISO()
  const today = appts.filter((a) => a.date === t && a.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time))
  const pending = appts.filter((a) => a.status === 'Pending' && a.date >= t)
  const confirm = async (a) => { await updateAppointmentStatus(a.id, 'Confirmed', user.name); toast('Appointment confirmed.'); reload() }
  return (
    <>
      <div className="mb-6"><h1 className="text-2xl font-semibold">Reception desk</h1><p className="text-sm text-muted">Welcome, {user.name}. {pending.length} appointment{pending.length === 1 ? '' : 's'} waiting for confirmation.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Today’s appointments" value={today.length} />
        <StatCard icon={Clock3} tone="warning" label="Awaiting confirmation" value={pending.length} />
        <StatCard icon={Users} tone="accent" label="Registered patients" value={patients.length} />
        <StatCard icon={Stethoscope} tone="success" label="Doctors available today" value={doctors.filter((d) => isWorkingDate(d, t)).length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Today’s schedule" className="lg:col-span-2" action={<Link to="/receptionist/appointments" className="text-xs text-brand">All appointments</Link>}>
          {today.length === 0 ? <EmptyState title="No appointments today" /> : today.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="flex items-center gap-4"><span className="w-20 text-sm font-semibold text-brand">{fmtTime(a.time)}</span><div><p className="text-sm font-medium">{a.patientName}</p><p className="text-xs text-muted">{a.doctorName} · {a.departmentName}</p></div></div>
              <div className="flex items-center gap-2"><StatusBadge status={a.status} />{a.status === 'Pending' && <button className="btn btn-ghost btn-sm" onClick={() => confirm(a)}>Confirm</button>}</div>
            </div>))}
        </Card>
        <Card title="Quick actions"><div className="grid gap-2">
          <Link to="/receptionist/book" className="btn btn-primary"><CalendarPlus size={16} />Book appointment</Link>
          <Link to="/receptionist/patients" className="btn btn-ghost"><UserPlus size={16} />Register / find patient</Link>
          <Link to="/receptionist/doctors" className="btn btn-ghost"><Stethoscope size={16} />Doctor availability</Link></div></Card>
      </div>
    </>
  )
}
