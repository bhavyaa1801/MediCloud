import { useState } from 'react'
import { Card, Field, PageHeader, Select } from '../../components/common/index.jsx'
import BookAppointment from '../patient/BookAppointment.jsx'
import { useData } from '../../hooks/useData.js'
import { getPatients } from '../../services/patientService.js'

export default function Book() {
  const { data: patients } = useData(getPatients, [], [])
  const [pid, setPid] = useState('')
  return (
    <>
      <PageHeader title="Book appointment" subtitle="Book a consultation on behalf of a patient. New patient? Register them first under Patients." />
      <Card className="mb-6"><Field label="Patient"><Select value={pid} onChange={setPid} placeholder="Select patient" options={patients.filter((p) => p.status === 'active').map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))} /></Field></Card>
      {pid && <BookAppointment key={pid} patientId={pid} appointmentsPath="/receptionist/appointments" embedded />}
    </>
  )
}
