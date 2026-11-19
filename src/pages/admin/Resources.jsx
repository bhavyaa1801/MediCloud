import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { DataTable, Field, Modal, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getResources, addResource, updateResource } from '../../services/resourceService.js'
import { getDepartments } from '../../services/doctorService.js'
import { getPatients } from '../../services/patientService.js'

const TYPES = ['Consultation Room', 'Bed', 'Equipment']
const STATUS = ['available', 'occupied', 'maintenance']
const blank = { name: '', type: 'Consultation Room', departmentId: '', status: 'available', assignedTo: null }

export default function Resources() {
  const { toast } = useApp()
  const { data, reload } = useData(getResources, [], [], ['resources'])
  const { data: depts } = useData(getDepartments, [], [])
  const { data: patients } = useData(getPatients, [], [])
  const [type, setType] = useState('')
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  useEffect(() => setErrors({}), [form])
  const v = form?.values
  const set = (k, val) => setForm({ ...form, values: { ...v, [k]: val } })

  const quick = async (r, status) => {
    try { await updateResource(r.id, { status }); toast(`${r.name} is now ${status}.`); reload() } catch (e) { toast(e.message, 'error') }
  }
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (v.name.trim().length < 3) er.name = 'Enter a resource name.'
    if (!v.departmentId) er.departmentId = 'Select a department.'
    setErrors(er)
    if (Object.keys(er).length) return
    try {
      const body = { name: v.name.trim(), type: v.type, departmentId: v.departmentId, status: v.status, assignedTo: v.status === 'occupied' ? v.assignedTo || null : null }
      if (form.mode === 'add') await addResource(body); else await updateResource(v.id, body)
      toast(form.mode === 'add' ? 'Resource added.' : 'Resource updated.'); setForm(null); reload()
    } catch (err) { setErrors({ assignedTo: err.message }) }
  }
  return (
    <>
      <PageHeader title="Hospital Resources" subtitle="Consultation rooms, beds and equipment." actions={<button className="btn btn-primary" onClick={() => setForm({ mode: 'add', values: blank })}><Plus size={16} />Add resource</button>} />
      <DataTable rows={data.filter((r) => !type || r.type === type)} searchKeys={['id', 'name', 'departmentName']} toolbar={<Select className="w-48" value={type} onChange={setType} placeholder="All types" options={TYPES} />} columns={[
        { label: 'ID', key: 'id' }, { label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> }, { label: 'Type', key: 'type' }, { label: 'Department', key: 'departmentName' },
        { label: 'Status', render: (r) => <StatusBadge status={r.status} /> }, { label: 'Assigned to', render: (r) => r.assignedName || '—' },
        { label: 'Actions', render: (r) => <div className="flex items-center gap-2"><Select className="w-32 py-1 text-xs" value={r.status} onChange={(s) => quick(r, s)} options={STATUS} /><button className="btn btn-ghost btn-sm" onClick={() => setForm({ mode: 'edit', values: r })}><Pencil size={14} /></button></div> },
      ]} />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'add' ? 'Add resource' : 'Edit resource'}>
        {form && <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Name" error={errors.name}><input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Type"><Select value={v.type} onChange={(x) => set('type', x)} options={TYPES} /></Field>
          <Field label="Department" error={errors.departmentId}><Select value={v.departmentId} onChange={(x) => set('departmentId', x)} placeholder="Select" options={depts.map((d) => ({ value: d.id, label: d.name }))} /></Field>
          <Field label="Availability"><Select value={v.status} onChange={(x) => set('status', x)} options={STATUS} /></Field>
          {v.status === 'occupied' && <Field label="Assigned patient" error={errors.assignedTo}><Select value={v.assignedTo || ''} onChange={(x) => set('assignedTo', x)} placeholder={v.type === 'Equipment' ? 'None' : 'Select patient'} options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))} /></Field>}
          {v.status !== 'occupied' && errors.assignedTo && <p className="text-xs text-danger">{errors.assignedTo}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary">Save</button></div></form>}
      </Modal>
    </>
  )
}
