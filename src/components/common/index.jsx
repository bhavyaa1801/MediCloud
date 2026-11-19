import { useEffect, useMemo, useState } from 'react'
import { X, Search, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react'
import { initials } from '../../utils/format.js'

const tones = {
  blue: 'bg-brand/10 text-brand', amber: 'bg-warning/15 text-amber-700', green: 'bg-success/10 text-success',
  red: 'bg-danger/10 text-danger', slate: 'bg-slate-100 text-slate-600',
}
const statusTone = {
  Confirmed: 'blue', Pending: 'amber', Completed: 'green', Cancelled: 'red', active: 'green', inactive: 'slate',
  available: 'green', occupied: 'red', maintenance: 'amber', Success: 'green', Failed: 'red',
}
export const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones[statusTone[status] || 'slate']}`}>{status}</span>
)

const avatarColors = ['bg-brand/15 text-brand', 'bg-accent/15 text-accent', 'bg-success/15 text-success', 'bg-warning/20 text-amber-700']
export const Avatar = ({ name = '?', size = 40 }) => (
  <div style={{ width: size, height: size, fontSize: size / 2.8 }} className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatarColors[name.length % 4]}`}>{initials(name)}</div>
)

export const Spinner = () => <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand" /></div>

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className={`card max-h-[90vh] w-full overflow-y-auto p-6 shadow-xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const toneIcon = { brand: 'bg-brand/10 text-brand', accent: 'bg-accent/10 text-accent', success: 'bg-success/10 text-success', warning: 'bg-warning/15 text-amber-700', danger: 'bg-danger/10 text-danger' }
export const StatCard = ({ icon: Icon, label, value, tone = 'brand', hint }) => (
  <div className="card flex items-center gap-4 p-4">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneIcon[tone]}`}><Icon size={20} /></div>
    <div><p className="text-xs text-muted">{label}</p><p className="text-xl font-semibold">{value}</p>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
  </div>
)

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div><h1 className="text-2xl font-semibold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
)

export const EmptyState = ({ title = 'Nothing here yet', text }) => (
  <div className="flex flex-col items-center py-12 text-center">
    <Inbox className="mb-2 text-slate-300" size={36} /><p className="font-medium">{title}</p>{text && <p className="text-sm text-muted">{text}</p>}
  </div>
)

export const Field = ({ label, error, children, className = '' }) => (
  <div className={className}><label className="label">{label}</label>{children}{error && <p className="mt-1 text-xs text-danger">{error}</p>}</div>
)

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`card p-5 ${className}`}>
    {title && <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{title}</h2>{action}</div>}
    {children}
  </section>
)

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
    {tabs.map((t) => (
      <button key={t} onClick={() => onChange(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${value === t ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'}`}>{t}</button>
    ))}
  </div>
)

export function DataTable({ columns, rows = [], searchKeys = [], pageSize = 8, toolbar, empty = 'No records found' }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(s))) : rows
  }, [rows, q, searchKeys])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => setPage(1), [q, rows.length])
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize)
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        {searchKeys.length > 0 && (
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>{columns.map((c) => <th key={c.label} className="whitespace-nowrap px-4 py-3 font-medium">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((r, i) => (
              <tr key={r.id ?? i} className="hover:bg-slate-50/60">
                {columns.map((c) => <td key={c.label} className="whitespace-nowrap px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {slice.length === 0 && <EmptyState title={empty} />}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-muted">
        <span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  )
}

export const Select = ({ value, onChange, options, className = '', placeholder }) => (
  <select className={`input ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
)
