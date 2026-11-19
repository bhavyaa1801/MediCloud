import { useState } from 'react'
import { DataTable, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService.js'
import { getDoctors, getDepartments } from '../../services/doctorService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'

const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function Appointments({ manageStatuses } = {}) {
  const { toast, confirm } = useApp()
  const { data, reload } = useData(getAppointments, [], [], ['appointments'])
  const { data: doctors } = useData(getDoctors, [], [])
  const { data: depts } = useData(getDepartments, [], [])
  const [f, setF] = useState({ date: '', dept: '', doctor: '', status: '' })
  const rows = data.filter((a) => (!f.date || a.date === f.date) && (!f.dept || a.departmentId === f.dept) && (!f.doctor || a.doctorId === f.doctor) && (!f.status || a.status === f.status))
  const change = async (a, status) => {
    if (status === 'Cancelled' && !(await confirm({ title: 'Cancel appointment', message: `Cancel ${a.id} for ${a.patientName}?` }))) return
    await updateAppointmentStatus(a.id, status, 'Hospital Admin'); toast(`${a.id} marked ${status.toLowerCase()}.`); reload()
  }
  return (
    <>
      <PageHeader title="Appointments" subtitle="All hospital appointments." />
      <DataTable rows={rows} searchKeys={['id', 'patientName', 'doctorName']} toolbar={<>
        <input type="date" className="input w-40" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <Select className="w-44" value={f.dept} onChange={(v) => setF({ ...f, dept: v })} placeholder="All departments" options={depts.map((d) => ({ value: d.id, label: d.name }))} />
        <Select className="w-44" value={f.doctor} onChange={(v) => setF({ ...f, doctor: v })} placeholder="All doctors" options={doctors.map((d) => ({ value: d.id, label: d.name }))} />
        <Select className="w-36" value={f.status} onChange={(v) => setF({ ...f, status: v })} placeholder="All statuses" options={STATUSES} />
        {(f.date || f.dept || f.doctor || f.status) && <button className="btn btn-ghost btn-sm" onClick={() => setF({ date: '', dept: '', doctor: '', status: '' })}>Clear</button>}</>}
        columns={[{ label: 'ID', key: 'id' }, { label: 'Patient', render: (a) => <div><p className="font-medium">{a.patientName}</p><p className="text-xs text-muted">{a.patientId}</p></div> }, { label: 'Doctor', key: 'doctorName' }, { label: 'Department', key: 'departmentName' },
          { label: 'Date', render: (a) => fmtDate(a.date) }, { label: 'Time', render: (a) => fmtTime(a.time) }, { label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
          { label: 'Manage', render: (a) => <Select className="w-32 py-1 text-xs" value={a.status} onChange={(v) => change(a, v)} options={[...new Set([a.status, ...(manageStatuses || STATUSES)])]} /> }]} />
    </>
  )
}
