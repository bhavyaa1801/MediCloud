import { useState } from 'react'
import { Plus, Pencil, Eye, Building2 } from 'lucide-react'
import { Avatar, Field, Modal, PageHeader, Spinner } from '../../components/common/index.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getDepartments, getDoctors, addDepartment, updateDepartment } from '../../services/doctorService.js'

const STARTER = [['General Medicine', 'Primary care and chronic condition management'], ['Cardiology', 'Heart and vascular care'], ['Neurology', 'Brain, spine and nervous system'], ['Dermatology', 'Skin, hair and nail conditions'], ['Orthopedics', 'Bone, joint and sports injuries'], ['Pediatrics', 'Healthcare for infants, children and teens'], ['Gynecology', 'Women’s health, maternity and fertility'], ['Emergency Medicine', '24/7 trauma and critical care']]

export default function Departments() {
  const { toast } = useApp()
  const { data, loading, reload } = useData(getDepartments, [], [])
  const { data: doctors } = useData(getDoctors, [], [])
  const [form, setForm] = useState(null)
  const [view, setView] = useState(null)
  const [errors, setErrors] = useState({})
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (form.values.name.trim().length < 3) er.name = 'Enter a department name.'
    else if (data.some((d) => d.id !== form.values.id && d.name.toLowerCase() === form.values.name.trim().toLowerCase())) er.name = 'A department with this name exists.'
    if (!form.values.description.trim()) er.description = 'Enter a short description.'
    setErrors(er)
    if (Object.keys(er).length) return
    const { id, name, description, head } = form.values
    if (form.mode === 'add') await addDepartment({ name: name.trim(), description, head }); else await updateDepartment(id, { name: name.trim(), description, head })
    toast(form.mode === 'add' ? 'Department added.' : 'Department updated.'); setForm(null); reload()
  }
  const addStarter = async () => { for (const [name, description] of STARTER) await addDepartment({ name, description, head: '' }); toast('Starter departments added.'); reload() }
  const open = (f) => { setErrors({}); setForm(f) }
  const set = (k) => (e) => setForm({ ...form, values: { ...form.values, [k]: e.target.value } })
  return (
    <>
      <PageHeader title="Departments" subtitle="Hospital departments and their teams." actions={<button className="btn btn-primary" onClick={() => open({ mode: 'add', values: { name: '', description: '', head: '' } })}><Plus size={16} />Add department</button>} />
      {!loading && data.length === 0 && <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-5 text-sm"><span>No departments yet. Start with the 8 standard hospital departments, or add your own.</span><button className="btn btn-primary" onClick={addStarter}>Add starter departments</button></div>}
      {loading ? <Spinner /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((d) => (
        <div key={d.id} className="card p-5"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><Building2 size={20} /></div><span className="text-xs text-muted">{d.id}</span></div>
          <h3 className="mt-3 font-semibold">{d.name}</h3><p className="mt-1 text-sm text-muted">{d.description}</p><p className="mt-3 text-xs text-muted">Head: <b className="text-ink">{d.head || 'Not assigned'}</b> · {d.doctorCount} doctors</p>
          <div className="mt-4 flex gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setView(d)}><Eye size={14} />View</button><button className="btn btn-ghost btn-sm" onClick={() => open({ mode: 'edit', values: d })}><Pencil size={14} />Edit</button></div></div>))}</div>}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'add' ? 'Add department' : 'Edit department'}>
        {form && <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Name" error={errors.name}><input className="input" value={form.values.name} onChange={set('name')} /></Field>
          <Field label="Description" error={errors.description}><textarea rows={3} className="input" value={form.values.description} onChange={set('description')} /></Field>
          <Field label="Department head"><input className="input" value={form.values.head} onChange={set('head')} /></Field>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary">Save</button></div></form>}
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name}>
        {view && <div className="space-y-3 text-sm"><p className="text-muted">{view.description}</p><p className="font-medium">Doctors</p>
          {doctors.filter((d) => d.departmentId === view.id).map((d) => <div key={d.id} className="flex items-center gap-3"><Avatar name={d.name} size={32} /><div><p className="font-medium">{d.name}</p><p className="text-xs text-muted">{d.specialization}</p></div></div>)}
          {!doctors.some((d) => d.departmentId === view.id) && <p className="text-muted">No doctors assigned yet.</p>}</div>}
      </Modal>
    </>
  )
}
