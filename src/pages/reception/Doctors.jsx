import { useState } from 'react'
import { Avatar, DataTable, Modal, PageHeader, StatusBadge } from '../../components/common/index.jsx'
import { availabilityLabel } from '../../components/doctors/DoctorCard.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctors } from '../../services/doctorService.js'
import { DAYS } from '../../utils/schedule.js'
import { fmtTime, money } from '../../utils/format.js'

export default function Doctors() {
  const { data } = useData(getDoctors, [], [], ['doctors'])
  const [view, setView] = useState(null)
  return (
    <>
      <PageHeader title="Doctors" subtitle="Directory and availability (read-only)." />
      <DataTable rows={data} searchKeys={['name', 'specialization', 'departmentName']} columns={[
        { label: 'Doctor', render: (d) => <div className="flex items-center gap-3"><Avatar name={d.name} size={32} /><div><p className="font-medium">{d.name}</p><p className="text-xs text-muted">{d.id}</p></div></div> },
        { label: 'Specialization', key: 'specialization' }, { label: 'Department', key: 'departmentName' }, { label: 'Fee', render: (d) => money(d.fee) },
        { label: 'Availability', render: (d) => { const a = availabilityLabel(d); return <span className={a.ok ? 'text-success' : 'text-muted'}>{a.text}</span> } },
        { label: 'Status', render: (d) => <StatusBadge status={d.status} /> },
        { label: 'Schedule', render: (d) => <button className="btn btn-ghost btn-sm" onClick={() => setView(d)}>View</button> },
      ]} />
      <Modal open={!!view} onClose={() => setView(null)} title="Doctor schedule">
        {view && <div className="space-y-3 text-sm"><p className="font-semibold">{view.name}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">{DAYS.map((n, i) => <div key={n} className={`rounded-lg py-2 ${view.workingDays.includes(i) ? 'bg-brand/10 font-medium text-brand' : 'bg-slate-50 text-slate-400'}`}>{n}</div>)}</div>
          <p>Hours: {fmtTime(view.start)} – {fmtTime(view.end)} (break {fmtTime(view.breakStart)} – {fmtTime(view.breakEnd)})</p><p>Slot length: {view.slotMinutes} minutes</p><p>Blocked dates: {view.blockedDates.length ? view.blockedDates.join(', ') : 'None'}</p></div>}
      </Modal>
    </>
  )
}
