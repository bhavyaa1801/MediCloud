import { useState } from 'react'
import { EmptyState, Modal, PageHeader, Spinner } from '../../components/common/index.jsx'
import PrescriptionCard, { PrescriptionDetail } from '../../components/records/PrescriptionCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPrescriptions } from '../../services/recordService.js'

export default function Prescriptions() {
  const { user } = useAuth()
  const [view, setView] = useState(null)
  const { data, loading } = useData(() => getPrescriptions({ patientId: user.profileId }), [user.profileId], [], ['prescriptions'])
  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Medication prescribed by your doctors." />
      {loading ? <Spinner /> : data.length === 0 ? <EmptyState title="No prescriptions yet" /> : <div className="grid gap-4 md:grid-cols-2">{data.map((rx) => <PrescriptionCard key={rx.id} rx={rx} onView={setView} />)}</div>}
      <Modal open={!!view} onClose={() => setView(null)} title="Prescription details" wide>{view && <PrescriptionDetail rx={view} />}</Modal>
    </>
  )
}
