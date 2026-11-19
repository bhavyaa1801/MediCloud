import { Link } from 'react-router-dom'
import { Avatar, DataTable, PageHeader } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDoctorPatients } from '../../services/patientService.js'

export default function Patients() {
  const { user } = useAuth()
  const { data } = useData(() => getDoctorPatients(user.profileId), [user.profileId], [])
  return (
    <>
      <PageHeader title="Patients" subtitle="Patients who have booked appointments with you." />
      <DataTable rows={data} searchKeys={['name', 'id', 'email', 'phone']} columns={[
        { label: 'Patient', render: (p) => <div className="flex items-center gap-3"><Avatar name={p.name} size={32} /><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.id}</p></div></div> },
        { label: 'Gender', key: 'gender' }, { label: 'Blood group', key: 'bloodGroup' }, { label: 'Phone', key: 'phone' },
        { label: 'Action', render: (p) => <Link to={`/doctor/patients/${p.id}`} className="btn btn-ghost btn-sm">View</Link> },
      ]} />
    </>
  )
}
