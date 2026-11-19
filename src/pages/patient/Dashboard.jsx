import { Link } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, Clock3, CalendarPlus, Stethoscope, FileText, Pill, Bell, ArrowRight } from 'lucide-react'
import { Card, EmptyState, Spinner, StatCard, StatusBadge } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPatientAppointments } from '../../services/appointmentService.js'
import { getRecords, getPrescriptions } from '../../services/recordService.js'
import { getNotifications } from '../../services/notificationService.js'
import { fmtDate, fmtDateTime, fmtTime } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export default function Dashboard() {
  const { user } = useAuth()
  const id = user.profileId
  const { data: appts, loading } = useData(() => getPatientAppointments(id), [id], [], ['appointments'])
  const { data: records } = useData(() => getRecords({ patientId: id }), [id], [], ['records'])
  const { data: rx } = useData(() => getPrescriptions({ patientId: id }), [id], [], ['prescriptions'])
  const { data: notes } = useData(() => getNotifications(user.userId), [id], [], ['notifications'])
  const next = [...appts].filter((a) => a.date >= todayISO() && ['Pending', 'Confirmed'].includes(a.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  if (loading) return <Spinner />
  const actions = [[CalendarPlus, 'Book appointment', '/patient/book'], [Stethoscope, 'Find doctors', '/patient/doctors'], [FileText, 'View records', '/patient/records'], [Pill, 'Prescriptions', '/patient/prescriptions']]
  return (
    <>
      <div className="mb-6"><h1 className="text-2xl font-semibold">Hello, {user.name.split(' ')[0]} 👋</h1><p className="text-sm text-muted">Here’s a summary of your care.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Total appointments" value={appts.length} />
        <StatCard icon={CheckCircle2} tone="success" label="Completed" value={appts.filter((a) => a.status === 'Completed').length} />
        <StatCard icon={Clock3} tone="warning" label="Pending" value={appts.filter((a) => a.status === 'Pending').length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Upcoming appointment" className="lg:col-span-2">
          {next ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand/5 p-4">
              <div><p className="font-semibold">{next.doctorName}</p><p className="text-sm text-muted">{next.specialization} · {next.departmentName}</p><p className="mt-2 text-sm font-medium text-brand">{fmtDate(next.date)} at {fmtTime(next.time)}</p></div>
              <div className="text-right"><StatusBadge status={next.status} /><p className="mt-2 text-xs text-muted">{next.id}</p></div>
            </div>) : <EmptyState title="No upcoming appointments" text="Book a consultation with one of our specialists." />}
        </Card>
        <Card title="Quick actions"><div className="grid grid-cols-2 gap-2">{actions.map(([I, l, to]) => <Link key={l} to={to} className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-3 text-center text-xs font-medium hover:border-brand hover:text-brand"><I size={20} />{l}</Link>)}</div></Card>
        <Card title="Recent medical records" action={<Link to="/patient/records" className="text-xs text-brand">View all</Link>}>
          {records.slice(0, 3).map((r) => <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"><span className="truncate">{r.name}</span><span className="ml-2 shrink-0 text-xs text-muted">{fmtDate(r.date)}</span></div>)}
          {!records.length && <EmptyState title="No records" />}</Card>
        <Card title="Recent prescriptions" action={<Link to="/patient/prescriptions" className="text-xs text-brand">View all</Link>}>
          {rx.slice(0, 3).map((r) => <div key={r.id} className="border-b border-slate-100 py-2 text-sm last:border-0"><p className="font-medium">{r.medicines.map((m) => m.name).join(', ')}</p><p className="text-xs text-muted">{r.doctorName} · {fmtDate(r.date)}</p></div>)}
          {!rx.length && <EmptyState title="No prescriptions" />}</Card>
        <Card title="Notifications" action={<Link to="/patient/notifications" className="inline-flex items-center gap-1 text-xs text-brand">All <ArrowRight size={12} /></Link>}>
          {notes.slice(0, 3).map((n) => <div key={n.id} className="flex gap-2 border-b border-slate-100 py-2 text-sm last:border-0"><Bell size={14} className={`mt-1 shrink-0 ${n.read ? 'text-muted' : 'text-brand'}`} /><div><p className="font-medium">{n.title}</p><p className="text-xs text-muted">{fmtDateTime(n.createdAt)}</p></div></div>)}
          {!notes.length && <EmptyState title="No notifications" />}</Card>
      </div>
    </>
  )
}
