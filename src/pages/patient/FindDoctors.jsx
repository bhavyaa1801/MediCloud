import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { EmptyState, PageHeader, Select, Spinner } from '../../components/common/index.jsx'
import DoctorCard from '../../components/doctors/DoctorCard.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctors, getDepartments } from '../../services/doctorService.js'
import { addDaysISO, isWorkingDate, todayISO } from '../../utils/schedule.js'

export default function FindDoctors() {
  const { data: doctors, loading } = useData(getDoctors, [], [], ['doctors'])
  const { data: depts } = useData(getDepartments, [], [])
  const [f, setF] = useState({ q: '', dept: '', spec: '', avail: 'Any' })
  const specs = useMemo(() => [...new Set(doctors.filter((d) => !f.dept || d.departmentId === f.dept).map((d) => d.specialization))].sort(), [doctors, f.dept])
  const list = doctors.filter((d) => {
    if (d.status !== 'active') return false
    const q = f.q.toLowerCase()
    if (q && !`${d.name} ${d.specialization} ${d.departmentName}`.toLowerCase().includes(q)) return false
    if (f.dept && d.departmentId !== f.dept) return false
    if (f.spec && d.specialization !== f.spec) return false
    if (f.avail === 'Today') return isWorkingDate(d, todayISO())
    if (f.avail === 'Next 7 days') return Array.from({ length: 7 }, (_, i) => addDaysISO(i)).some((x) => isWorkingDate(d, x))
    return true
  })
  return (
    <>
      <PageHeader title="Find Doctors" subtitle="Search our specialists and book a consultation." />
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search name or specialty" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <Select value={f.dept} onChange={(v) => setF({ ...f, dept: v, spec: '' })} placeholder="All departments" options={depts.map((d) => ({ value: d.id, label: d.name }))} />
        <Select value={f.spec} onChange={(v) => setF({ ...f, spec: v })} placeholder="All specializations" options={specs} />
        <Select value={f.avail} onChange={(v) => setF({ ...f, avail: v })} options={['Any', 'Today', 'Next 7 days']} />
      </div>
      {loading ? <Spinner /> : list.length === 0 ? <EmptyState title="No doctors match your filters" /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((d) => <DoctorCard key={d.id} doctor={d} />)}</div>
      )}
    </>
  )
}
