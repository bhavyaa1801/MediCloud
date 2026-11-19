import { useState } from 'react'
import { Eye, Power } from 'lucide-react'
import { DataTable, Field, Modal, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { addStaff } from '../../services/staffService.js'
import { isEmail, isPhone } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getUsers, updateUser } from '../../services/adminService.js'

export default function Users() {
  const { user: me } = useAuth()
  const { toast, confirm } = useApp()
  const { data, reload } = useData(getUsers, [], [])
  const [role, setRole] = useState('')
  const [view, setView] = useState(null)
  const [staff, setStaff] = useState(null)
  const [errs, setErrs] = useState({})
  const saveStaff = async (e) => {
    e.preventDefault(); const er = {}
    if (staff.name.trim().length < 3) er.name = 'Enter a full name.'
    if (!isEmail(staff.email)) er.email = 'Enter a valid email.'
    if (!isPhone(staff.phone)) er.phone = 'Enter a valid phone number.'
    setErrs(er); if (Object.keys(er).length) return
    await addStaff(staff); toast('Receptionist added. They will get an email to set their password.'); setStaff(null); reload()
  }
  const changeRole = async (u, r) => {
    if (!(await confirm({ title: 'Change role', message: `Change ${u.name}'s role to ${r}?`, danger: false, confirmText: 'Change role' }))) return reload()
    await updateUser(u.id, { role: r }); toast('Role updated.'); reload()
  }
  const toggle = async (u) => {
    const next = u.status === 'active' ? 'inactive' : 'active'
    if (!(await confirm({ title: 'Update account status', message: `Set ${u.name}'s account to ${next}?`, danger: next === 'inactive' }))) return
    await updateUser(u.id, { status: next }); toast(`Account ${next}.`); reload()
  }
  return (
    <>
      <PageHeader title="User Management" subtitle="Accounts and roles across the platform." actions={<button className="btn btn-primary" onClick={() => { setErrs({}); setStaff({ name: '', email: '', phone: '' }) }}>Add receptionist</button>} />
      <DataTable rows={data.filter((u) => !role || u.role === role)} searchKeys={['name', 'email', 'role']} toolbar={<Select className="w-40" value={role} onChange={setRole} placeholder="All roles" options={['patient', 'doctor', 'admin']} />} columns={[
        { label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> }, { label: 'Email', key: 'email' },
        { label: 'Role', render: (u) => u.role === 'doctor' || u.role === 'receptionist' || u.id === me.userId ? <span className="capitalize">{u.role}</span> : <Select className="w-28 py-1 text-xs capitalize" value={u.role} onChange={(r) => changeRole(u, r)} options={['patient', 'admin']} /> },
        { label: 'Status', render: (u) => <StatusBadge status={u.status} /> },
        { label: 'Actions', render: (u) => <div className="flex gap-1.5"><button className="btn btn-ghost btn-sm" onClick={() => setView(u)}><Eye size={14} /></button>{u.id !== me.userId && <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}><Power size={14} /></button>}</div> },
      ]} />
      <Modal open={!!view} onClose={() => setView(null)} title="Account information">
        {view && <dl className="space-y-2 text-sm">{[['User ID', view.id], ['Profile ID', view.profileId], ['Name', view.name], ['Email', view.email], ['Role', view.role]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>)}<div className="flex justify-between"><dt className="text-muted">Status</dt><dd><StatusBadge status={view.status} /></dd></div></dl>}
      </Modal>
      <Modal open={!!staff} onClose={() => setStaff(null)} title="Add receptionist">
        {staff && <form onSubmit={saveStaff} noValidate className="space-y-4">
          <Field label="Full name" error={errs.name}><input className="input" value={staff.name} onChange={(e) => setStaff({ ...staff, name: e.target.value })} /></Field>
          <Field label="Email (used to log in)" error={errs.email}><input className="input" value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} /></Field>
          <Field label="Phone" error={errs.phone}><input className="input" value={staff.phone} onChange={(e) => setStaff({ ...staff, phone: e.target.value })} /></Field>
          <p className="text-xs text-muted">They will receive an email with a link to set their own password, then log in at the same address as everyone else.</p>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setStaff(null)}>Cancel</button><button className="btn btn-primary">Add receptionist</button></div></form>}
      </Modal>
    </>
  )
}
