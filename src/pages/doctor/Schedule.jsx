import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card, Field, PageHeader, Select, Spinner } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getDoctor, updateDoctor } from '../../services/doctorService.js'
import { buildSlots, DAYS, todayISO } from '../../utils/schedule.js'
import { fmtDate, fmtTime } from '../../utils/format.js'

export default function Schedule() {
  const { user } = useAuth()
  const { toast } = useApp()
  const [d, setD] = useState(null)
  const [block, setBlock] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { getDoctor(user.profileId).then(setD) }, [user.profileId])
  if (!d) return <Spinner />
  const set = (k, v) => setD({ ...d, [k]: v })
  const toggleDay = (i) => set('workingDays', d.workingDays.includes(i) ? d.workingDays.filter((x) => x !== i) : [...d.workingDays, i].sort())
  const save = async () => {
    if (!d.workingDays.length) return setErr('Select at least one working day.')
    if (d.start >= d.end) return setErr('End time must be after start time.')
    if (d.breakStart && d.breakEnd && (d.breakStart >= d.breakEnd || d.breakStart < d.start || d.breakEnd > d.end)) return setErr('Break must fall within working hours.')
    setErr('')
    setD(await updateDoctor(user.profileId, { workingDays: d.workingDays, start: d.start, end: d.end, breakStart: d.breakStart, breakEnd: d.breakEnd, slotMinutes: Number(d.slotMinutes), blockedDates: d.blockedDates }, user.name))
    toast('Schedule updated. Patients will see the new availability.')
  }
  const addBlock = () => {
    if (!block || block < todayISO()) return setErr('Choose a future date to block.')
    if (d.blockedDates.includes(block)) return setErr('That date is already blocked.')
    setErr(''); set('blockedDates', [...d.blockedDates, block].sort()); setBlock('')
  }
  const perDay = buildSlots({ ...d, workingDays: [0, 1, 2, 3, 4, 5, 6], blockedDates: [], status: 'active' }, todayISO()).length
  return (
    <>
      <PageHeader title="My Schedule" subtitle="Manage the days and hours patients can book." actions={<button className="btn btn-primary" onClick={save}>Save schedule</button>} />
      {err && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{err}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Working days & hours">
          <div className="mb-5 flex flex-wrap gap-2">{DAYS.map((n, i) => <button key={n} onClick={() => toggleDay(i)} className={`h-10 w-12 rounded-lg border text-sm font-medium ${d.workingDays.includes(i) ? 'border-brand bg-brand text-white' : 'border-slate-200 text-muted'}`}>{n}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start time"><input type="time" className="input" value={d.start} onChange={(e) => set('start', e.target.value)} /></Field>
            <Field label="End time"><input type="time" className="input" value={d.end} onChange={(e) => set('end', e.target.value)} /></Field>
            <Field label="Break start"><input type="time" className="input" value={d.breakStart} onChange={(e) => set('breakStart', e.target.value)} /></Field>
            <Field label="Break end"><input type="time" className="input" value={d.breakEnd} onChange={(e) => set('breakEnd', e.target.value)} /></Field>
            <Field label="Appointment duration"><Select value={String(d.slotMinutes)} onChange={(v) => set('slotMinutes', Number(v))} options={[{ value: '15', label: '15 minutes' }, { value: '20', label: '20 minutes' }, { value: '30', label: '30 minutes' }, { value: '45', label: '45 minutes' }, { value: '60', label: '60 minutes' }]} /></Field>
          </div>
        </Card>
        <Card title="Blocked dates">
          <div className="flex gap-2"><input type="date" className="input" min={todayISO()} value={block} onChange={(e) => setBlock(e.target.value)} /><button className="btn btn-ghost" onClick={addBlock}><Plus size={16} />Block</button></div>
          <div className="mt-4 flex flex-wrap gap-2">{d.blockedDates.length === 0 && <p className="text-sm text-muted">No blocked dates.</p>}
            {d.blockedDates.map((x) => <span key={x} className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-xs text-danger">{fmtDate(x)}<button onClick={() => set('blockedDates', d.blockedDates.filter((y) => y !== x))} aria-label="Remove"><X size={12} /></button></span>)}</div>
          <p className="mt-4 text-xs text-muted">Remember to save after adding or removing dates.</p>
        </Card>
        <Card title="Weekly schedule" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-7">{DAYS.map((n, i) => { const on = d.workingDays.includes(i); return (
            <div key={n} className={`rounded-xl border p-3 text-center text-xs ${on ? 'border-brand/30 bg-brand/5' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <p className="font-semibold">{n}</p>{on ? <><p className="mt-1">{fmtTime(d.start)}–{fmtTime(d.end)}</p><p className="text-muted">Break {fmtTime(d.breakStart)}</p><p className="mt-1 font-medium text-brand">{perDay} slots</p></> : <p className="mt-1">Off</p>}</div>) })}</div>
        </Card>
      </div>
    </>
  )
}
