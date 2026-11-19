import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Briefcase, Clock, Banknote } from 'lucide-react'
import { Avatar, Card, EmptyState, Spinner } from '../../components/common/index.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctor } from '../../services/doctorService.js'
import { getAvailableSlots } from '../../services/appointmentService.js'
import { addDaysISO, DAYS, isWorkingDate } from '../../utils/schedule.js'
import { fmtTime, money } from '../../utils/format.js'

export default function DoctorProfile() {
  const { id } = useParams()
  const { data: d, loading } = useData(() => getDoctor(id), [id])
  const [date, setDate] = useState('')
  const { data: slots } = useData(() => getAvailableSlots(id, date), [id, date], [])
  if (loading) return <Spinner />
  if (!d) return <EmptyState title="Doctor not found" />
  const dates = Array.from({ length: 14 }, (_, i) => addDaysISO(i)).filter((x) => isWorkingDate(d, x)).slice(0, 7)
  return (
    <>
      <Link to="/patient/doctors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"><ArrowLeft size={14} />Back to doctors</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1"><div className="flex flex-col items-center text-center"><Avatar name={d.name} size={80} /><h1 className="mt-3 text-xl font-semibold">{d.name}</h1><p className="text-sm text-brand">{d.specialization}</p><p className="text-sm text-muted">{d.departmentName}</p></div>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex gap-2"><GraduationCap size={16} className="mt-0.5 text-muted" />{d.qualifications}</li>
            <li className="flex gap-2"><Briefcase size={16} className="mt-0.5 text-muted" />{d.experience} years experience</li>
            <li className="flex gap-2"><Banknote size={16} className="mt-0.5 text-muted" />{money(d.fee)} per consultation</li>
            <li className="flex gap-2"><Clock size={16} className="mt-0.5 text-muted" />{d.workingDays.map((x) => DAYS[x]).join(', ')} · {fmtTime(d.start)} – {fmtTime(d.end)}</li>
          </ul><p className="mt-4 text-sm text-muted">{d.bio}</p></Card>
        <Card title="Available dates & time slots" className="lg:col-span-2">
          {dates.length === 0 ? <EmptyState title="No upcoming availability" /> : <>
            <div className="flex flex-wrap gap-2">{dates.map((x) => { const dt = new Date(x + 'T00:00:00'); return (
              <button key={x} onClick={() => setDate(x)} className={`rounded-xl border px-3 py-2 text-center text-xs ${date === x ? 'border-brand bg-brand text-white' : 'border-slate-200 hover:border-brand'}`}><span className="block font-medium">{DAYS[dt.getDay()]}</span><span className="text-base font-semibold">{dt.getDate()}</span><span className="block">{dt.toLocaleString('en', { month: 'short' })}</span></button>) })}</div>
            {date && <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((s) => <span key={s.time} className={`rounded-lg border px-2 py-2 text-center text-sm ${s.booked ? 'border-slate-100 bg-slate-50 text-slate-400 line-through' : 'border-success/30 text-success'}`}>{fmtTime(s.time)}</span>)}</div>}
            {!date && <p className="mt-4 text-sm text-muted">Select a date to view time slots.</p>}
            <Link to={`/patient/book?doctor=${d.id}${date ? `&date=${date}` : ''}`} className="btn btn-primary mt-6">Book Appointment</Link></>}
        </Card>
      </div>
    </>
  )
}
