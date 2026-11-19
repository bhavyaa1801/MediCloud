import { Link } from 'react-router-dom'
import { CalendarDays, Users, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, EmptyState, Spinner, StatCard, StatusBadge } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctorAppointments } from '../../services/appointmentService.js'
import { getRecords, getPrescriptions } from '../../services/recordService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export default function Dashboard() {
  const { user } = useAuth()
  const id = user.profileId
  const { data: appts, loading } = useData(() => getDoctorAppointments(id), [id], [], ['appointments'])
  const { data: recs } = useData(() => getRecords({ doctorId: id }), [id], [], ['records'])
  const { data: rx } = useData(() => getPrescriptions({ doctorId: id }), [id], [], ['prescriptions'])
  if (loading) return <Spinner />
  const t = todayISO()
  const today = appts.filter((a) => a.date === t && a.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = appts.filter((a) => a.date > t && ['Pending', 'Confirmed'].includes(a.status))
  const stats = ['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((s) => ({ status: s, count: appts.filter((a) => a.status === s).length }))
  const activity = [...recs.map((r) => ({ id: r.id, text: `Record added for ${r.patientName}: ${r.name}`, date: r.date })), ...rx.map((r) => ({ id: r.id, text: `Prescription ${r.id} issued to ${r.patientName}`, date: r.date }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return (
    <>
      <div className="mb-6"><h1 className="text-2xl font-semibold">Good day, {user.name}</h1><p className="text-sm text-muted">You have {today.length} appointment{today.length === 1 ? '' : 's'} today.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Today’s appointments" value={today.length} />
        <StatCard icon={Users} tone="accent" label="Total patients" value={new Set(appts.map((a) => a.patientId)).size} />
        <StatCard icon={CalendarClock} tone="warning" label="Upcoming" value={upcoming.length} />
        <StatCard icon={CheckCircle2} tone="success" label="Completed" value={appts.filter((a) => a.status === 'Completed').length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Today’s schedule" className="lg:col-span-2" action={<Link to="/doctor/appointments" className="text-xs text-brand">All appointments</Link>}>
          {today.length === 0 ? <EmptyState title="No appointments today" /> : today.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="flex items-center gap-4"><span className="w-20 text-sm font-semibold text-brand">{fmtTime(a.time)}</span><div><p className="text-sm font-medium">{a.patientName}</p><p className="text-xs text-muted">{a.reason}</p></div></div>
              <div className="flex items-center gap-2"><StatusBadge status={a.status} />{a.status !== 'Completed' && <Link to={`/doctor/consult/${a.id}`} className="btn btn-ghost btn-sm">Consult</Link>}</div>
            </div>))}
        </Card>
        <Card title="Appointment statistics"><div className="h-52"><ResponsiveContainer><BarChart data={stats}><CartesianGrid vertical={false} stroke="#EDF0F7" /><XAxis dataKey="status" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} /><Tooltip /><Bar dataKey="count" fill="#4263EB" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Recent patient activity" className="lg:col-span-3">
          {activity.length === 0 ? <EmptyState title="No recent activity" /> : activity.map((a) => <div key={a.id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0"><span>{a.text}</span><span className="text-xs text-muted">{fmtDate(a.date)}</span></div>)}
        </Card>
      </div>
    </>
  )
}
