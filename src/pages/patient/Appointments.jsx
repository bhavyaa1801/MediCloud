import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, StatusBadge, Tabs } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPatientAppointments, cancelAppointment } from '../../services/appointmentService.js'
import { fmtDate, fmtTime } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

export default function Appointments() {
  const { user } = useAuth()
  const { toast, confirm } = useApp()
  const [tab, setTab] = useState('All')
  const { data, reload } = useData(() => getPatientAppointments(user.profileId), [user.profileId], [], ['appointments'])
  const upcoming = (a) => a.date >= todayISO() && ['Pending', 'Confirmed'].includes(a.status)
  const rows = data.filter((a) => tab === 'All' || (tab === 'Upcoming' ? upcoming(a) : a.status === tab))
  const cancel = async (a) => {
    if (!(await confirm({ title: 'Cancel appointment', message: `Cancel your appointment with ${a.doctorName} on ${fmtDate(a.date)}?`, confirmText: 'Cancel appointment' }))) return
    await cancelAppointment(a.id, user.name); toast('Appointment cancelled.'); reload()
  }
  return (
    <>
      <PageHeader title="My Appointments" actions={<Link to="/patient/book" className="btn btn-primary">Book appointment</Link>} />
      <div className="mb-4"><Tabs tabs={['All', 'Upcoming', 'Completed', 'Cancelled']} value={tab} onChange={setTab} /></div>
      <DataTable rows={rows} searchKeys={['doctorName', 'departmentName', 'id']} columns={[
        { label: 'ID', key: 'id' }, { label: 'Doctor', render: (a) => <div><p className="font-medium">{a.doctorName}</p><p className="text-xs text-muted">{a.specialization}</p></div> },
        { label: 'Department', key: 'departmentName' }, { label: 'Date', render: (a) => fmtDate(a.date) }, { label: 'Time', render: (a) => fmtTime(a.time) },
        { label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
        { label: 'Action', render: (a) => upcoming(a) ? <button className="btn btn-ghost btn-sm text-danger" onClick={() => cancel(a)}>Cancel</button> : <span className="text-xs text-muted">—</span> },
      ]} />
    </>
  )
}
