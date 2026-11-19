import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { EmptyState, Field, Modal, PageHeader, Select } from '../../components/common/index.jsx'
import PrescriptionCard, { PrescriptionDetail } from '../../components/records/PrescriptionCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getPrescriptions, addPrescription } from '../../services/recordService.js'
import { getDoctorPatients } from '../../services/patientService.js'

const med = () => ({ name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '' })
const FREQ = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 8 hours', 'As needed']

export default function Prescriptions() {
  const { user } = useAuth()
  const { toast } = useApp()
  const [params] = useSearchParams()
  const { data, reload } = useData(() => getPrescriptions({ doctorId: user.profileId }), [user.profileId], [], ['prescriptions'])
  const { data: patients } = useData(() => getDoctorPatients(user.profileId), [user.profileId], [])
  const [open, setOpen] = useState(!!params.get('patient'))
  const [view, setView] = useState(null)
  const [patientId, setPatientId] = useState(params.get('patient') || '')
  const [meds, setMeds] = useState([med()])
  const [errors, setErrors] = useState([])
  useEffect(() => { if (open && !params.get('patient')) { setPatientId(''); setMeds([med()]); setErrors([]) } }, [open]) // eslint-disable-line
  const setMed = (i, k, v) => setMeds(meds.map((m, j) => (j === i ? { ...m, [k]: v } : m)))
  const submit = async (e) => {
    e.preventDefault()
    const er = []
    if (!patientId) er.push('Select a patient.')
    meds.forEach((m, i) => { if (!m.name.trim() || !m.dosage.trim() || !m.duration.trim()) er.push(`Medicine ${i + 1}: name, dosage and duration are required.`) })
    setErrors(er)
    if (er.length) return
    await addPrescription({ patientId, doctorId: user.profileId, medicines: meds, notes: '' }, user.name)
    toast('Prescription saved and sent to the patient.'); setOpen(false); setMeds([med()]); reload()
  }
  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Prescriptions you have issued." actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New prescription</button>} />
      {data.length === 0 ? <EmptyState title="No prescriptions yet" /> : <div className="grid gap-4 md:grid-cols-2">{data.map((rx) => <PrescriptionCard key={rx.id} rx={rx} party="patient" onView={setView} />)}</div>}
      <Modal open={open} onClose={() => setOpen(false)} title="New prescription" wide>
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.length > 0 && <ul className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{errors.map((x) => <li key={x}>{x}</li>)}</ul>}
          <Field label="Patient"><Select value={patientId} onChange={setPatientId} placeholder="Select patient" options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))} /></Field>
          {meds.map((m, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-surface p-4">
              <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Medicine {i + 1}</p>{meds.length > 1 && <button type="button" className="text-danger" onClick={() => setMeds(meds.filter((_, j) => j !== i))} aria-label="Remove medicine"><Trash2 size={16} /></button>}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Medicine name"><input className="input" value={m.name} onChange={(e) => setMed(i, 'name', e.target.value)} /></Field>
                <Field label="Dosage"><input className="input" placeholder="e.g. 500 mg" value={m.dosage} onChange={(e) => setMed(i, 'dosage', e.target.value)} /></Field>
                <Field label="Frequency"><Select value={m.frequency} onChange={(v) => setMed(i, 'frequency', v)} options={FREQ} /></Field>
                <Field label="Duration"><input className="input" placeholder="e.g. 7 days" value={m.duration} onChange={(e) => setMed(i, 'duration', e.target.value)} /></Field>
                <Field className="sm:col-span-2" label="Instructions"><input className="input" value={m.instructions} onChange={(e) => setMed(i, 'instructions', e.target.value)} /></Field>
              </div>
            </div>))}
          <button type="button" className="btn btn-ghost" onClick={() => setMeds([...meds, med()])}><Plus size={16} />Add another medicine</button>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary">Save prescription</button></div>
        </form>
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} title="Prescription details" wide>{view && <PrescriptionDetail rx={view} />}</Modal>
    </>
  )
}
