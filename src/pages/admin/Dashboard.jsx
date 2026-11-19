import { Users, Stethoscope, CalendarCheck, CalendarDays, DoorOpen, BedDouble } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Card, Spinner, StatCard, StatusBadge, Avatar } from '../../components/common/index.jsx'
import { useData } from '../../hooks/useData.js'
import { getAppointments } from '../../services/appointmentService.js'
import { getPatients } from '../../services/patientService.js'
import { getDoctors, getDepartments } from '../../services/doctorService.js'
import { getResources } from '../../services/resourceService.js'
import { appointmentTrend, registrationTrend, PIE_COLORS } from '../../data/analytics.js'
import { fmtDate, fmtTime } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export default function Dashboard() {
  const { data: appts, loading } = useData(getAppointments, [], [], ['appointments'])
  const { data: patients } = useData(getPatients, [], [])
  const { data: doctors } = useData(getDoctors, [], [])
  const { data: depts } = useData(getDepartments, [], [])
  const { data: res } = useData(getResources, [], [])
  if (loading) return <Spinner />
  const rooms = res.filter((r) => r.type !== 'Equipment')
  const dist = depts.map((d) => ({ name: d.name, value: appts.filter((a) => a.departmentId === d.id).length })).filter((d) => d.value)
  const recentReg = [...patients].sort((a, b) => b.registeredOn.localeCompare(a.registeredOn)).slice(0, 5)
  const types = ['Consultation Room', 'Bed', 'Equipment'].map((t) => { const l = res.filter((r) => r.type === t); return { t, free: l.filter((r) => r.status === 'available').length, total: l.length } })
  const grid = 'stroke-slate-100'
  return (
    <>
      <div className="mb-6"><h1 className="text-2xl font-semibold">Hospital overview</h1><p className="text-sm text-muted">Live summary of hospital activity.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total patients" value={patients.length} />
        <StatCard icon={Stethoscope} tone="accent" label="Total doctors" value={doctors.length} />
        <StatCard icon={CalendarCheck} tone="success" label="Total appointments" value={appts.length} />
        <StatCard icon={CalendarDays} tone="warning" label="Today’s appointments" value={appts.filter((a) => a.date === todayISO()).length} />
        <StatCard icon={DoorOpen} tone="success" label="Available rooms & beds" value={rooms.filter((r) => r.status === 'available').length} />
        <StatCard icon={BedDouble} tone="danger" label="Occupied rooms & beds" value={rooms.filter((r) => r.status === 'occupied').length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Appointment trends"><div className="h-60"><ResponsiveContainer><AreaChart data={appointmentTrend}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4263EB" stopOpacity={0.25} /><stop offset="100%" stopColor="#4263EB" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} className={grid} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={30} /><Tooltip /><Area dataKey="appointments" stroke="#4263EB" strokeWidth={2} fill="url(#g)" /></AreaChart></ResponsiveContainer></div></Card>
        <Card title="Patient registrations"><div className="h-60"><ResponsiveContainer><BarChart data={registrationTrend}><CartesianGrid vertical={false} className={grid} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={30} /><Tooltip /><Bar dataKey="patients" fill="#8275D9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Appointments by department"><div className="h-60"><ResponsiveContainer><PieChart><Pie data={dist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{dist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Resource availability"><div className="space-y-4">{types.map(({ t, free, total }) => <div key={t}><div className="mb-1 flex justify-between text-sm"><span>{t}s</span><span className="text-muted">{free}/{total} available</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-success" style={{ width: `${total ? (free / total) * 100 : 0}%` }} /></div></div>)}</div></Card>
        <Card title="Recent appointments">{appts.slice(0, 5).map((a) => <div key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0"><div><p className="font-medium">{a.patientName}</p><p className="text-xs text-muted">{a.doctorName} · {fmtDate(a.date)} {fmtTime(a.time)}</p></div><StatusBadge status={a.status} /></div>)}</Card>
        <Card title="Recent registrations">{recentReg.map((p) => <div key={p.id} className="flex items-center gap-3 border-b border-slate-100 py-2 text-sm last:border-0"><Avatar name={p.name} size={32} /><div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.id}</p></div><span className="text-xs text-muted">{fmtDate(p.registeredOn)}</span></div>)}</Card>
        <Card title="Department overview" className="lg:col-span-2"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{depts.map((d) => <div key={d.id} className="rounded-xl bg-surface p-3"><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-muted">{d.doctorCount} doctor{d.doctorCount === 1 ? '' : 's'} · {appts.filter((a) => a.departmentId === d.id).length} appts</p></div>)}</div></Card>
      </div>
    </>
  )
}
