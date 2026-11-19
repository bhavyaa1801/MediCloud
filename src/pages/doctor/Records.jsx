import { useEffect, useState } from 'react'
import { Eye, UploadCloud, Plus } from 'lucide-react'
import { DataTable, Field, Modal, PageHeader, Select } from '../../components/common/index.jsx'
import RecordPreview from '../../components/records/RecordPreview.jsx'
import { RECORD_TYPES } from '../patient/Records.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getRecords, addRecord } from '../../services/recordService.js'
import { getDoctorPatients } from '../../services/patientService.js'
import { fmtDate } from '../../utils/format.js'
import { todayISO } from '../../utils/schedule.js'

const blank = { patientId: '', type: 'Lab Report', name: '', date: todayISO(), notes: '', fileName: '' }

export default function Records() {
  const { user } = useAuth()
  const { toast } = useApp()
  const { data, reload } = useData(() => getRecords({ doctorId: user.profileId }), [user.profileId], [], ['records'])
  const { data: patients } = useData(() => getDoctorPatients(user.profileId), [user.profileId], [])
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(null)
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF(blank); setErrors({}) } }, [open])
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.patientId) er.patientId = 'Select a patient.'
    if (f.name.trim().length < 3) er.name = 'Enter a document name.'
    if (!f.fileName) er.fileName = 'Attach a sample file (mock upload).'
    if (!f.date) er.date = 'Select a date.'
    setErrors(er)
    if (Object.keys(er).length) return
    try { await addRecord({ ...f, doctorId: user.profileId, notes: f.notes || 'No additional notes.' }, user.name) } catch (err) { return toast(err.message, 'error') }
    toast('Record uploaded and linked to patient.'); setOpen(false); reload()
  }
  return (
    <>
      <PageHeader title="Medical Records" subtitle="Reports and records you have added." actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Upload record</button>} />
      <DataTable rows={data} searchKeys={['name', 'patientName', 'type']} columns={[
        { label: 'Document', key: 'name' }, { label: 'Patient', render: (r) => <div><p>{r.patientName}</p><p className="text-xs text-muted">{r.patientId}</p></div> }, { label: 'Type', key: 'type' },
        { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'View', render: (r) => <button className="btn btn-ghost btn-sm" onClick={() => setView(r)}><Eye size={14} />View</button> },
      ]} />
      <Modal open={open} onClose={() => setOpen(false)} title="Upload medical record" wide>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient" error={errors.patientId}><Select value={f.patientId} onChange={(v) => setF({ ...f, patientId: v })} placeholder="Select patient" options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))} /></Field>
          <Field label="Record type"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={RECORD_TYPES} /></Field>
          <Field label="Document name" error={errors.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Date" error={errors.date}><input type="date" className="input" max={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <div className="sm:col-span-2"><label className="label">File (PDF, JPG or PNG, max 5 MB)</label>
            <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-brand"><UploadCloud className="text-brand" /><span className="mt-1 text-sm">{f.fileName || 'Click to choose a file'}</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setF({ ...f, file: e.target.files[0] || null, fileName: e.target.files[0]?.name || '' })} /></label>
            {errors.fileName && <p className="mt-1 text-xs text-danger">{errors.fileName}</p>}</div>
          <Field className="sm:col-span-2" label="Findings / notes"><textarea rows={3} className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary">Save record</button></div>
        </form>
      </Modal>
      <RecordPreview record={view} onClose={() => setView(null)} />
    </>
  )
}
