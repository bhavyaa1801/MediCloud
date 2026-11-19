import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, PageHeader, Select, StatusBadge, Tabs } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctorAppointments, updateAppointmentStatus } from '../../services/appointmentService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function Appointments() {
  const { user } = useAuth()
  const { toast, confirm } = useApp()
  const [tab, setTab] = useState('Today')
  const { data, reload } = useData(() => getDoctorAppointments(user.profileId), [user.profileId], [], ['appointments'])
  const t = todayISO()
  const rows = data.filter((a) => tab === 'Today' ? a.date === t : tab === 'Upcoming' ? a.date > t && a.status !== 'Cancelled' && a.status !== 'Completed' : a.status === tab)
  const change = async (a, status) => {
    if (status === 'Cancelled' && !(await confirm({ title: 'Cancel appointment', message: `Cancel ${a.patientName}'s appointment? The patient will be notified.` }))) return
    await updateAppointmentStatus(a.id, status, user.name); toast(`Appointment marked ${status.toLowerCase()}.`); reload()
  }
  return (
    <>
      <PageHeader title="My Appointments" />
      <div className="mb-4"><Tabs tabs={['Today', 'Upcoming', 'Completed', 'Cancelled']} value={tab} onChange={setTab} /></div>
      <DataTable rows={rows} searchKeys={['patientName', 'patientId', 'reason']} columns={[
        { label: 'Patient', render: (a) => <div><Link to={`/doctor/patients/${a.patientId}`} className="font-medium hover:text-brand">{a.patientName}</Link><p className="text-xs text-muted">{a.patientId}</p></div> },
        { label: 'Date', render: (a) => fmtDate(a.date) }, { label: 'Time', render: (a) => fmtTime(a.time) }, { label: 'Reason', key: 'reason' },
        { label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
        { label: 'Update', render: (a) => <div className="flex items-center gap-2"><Select className="w-32 py-1 text-xs" value={a.status} onChange={(v) => change(a, v)} options={STATUSES} />{a.status !== 'Cancelled' && <Link to={`/doctor/consult/${a.id}`} className="btn btn-ghost btn-sm">Consult</Link>}</div> },
      ]} />
    </>
  )
}
