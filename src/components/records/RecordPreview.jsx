import { Download, FileText } from 'lucide-react'
import { Modal } from '../common/index.jsx'
import { fmtDate } from '../../utils/format.js'
import { useApp } from '../../context/AppContext.jsx'
import { downloadRecord } from '../../services/recordService.js'

export default function RecordPreview({ record, onClose }) {
  const { toast } = useApp()
  if (!record) return null
  return (
    <Modal open onClose={onClose} title="Document preview" wide>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 font-semibold text-brand"><FileText size={18} />MediCloud Hospital</div>
          <span className="text-xs text-muted">{record.id}</span>
        </div>
        <h4 className="text-lg font-semibold">{record.name}</h4>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-muted">Patient</dt><dd>{record.patientName}</dd></div>
          <div><dt className="text-xs text-muted">Doctor</dt><dd>{record.doctorName}</dd></div>
          <div><dt className="text-xs text-muted">Type</dt><dd>{record.type}</dd></div>
          <div><dt className="text-xs text-muted">Date</dt><dd>{fmtDate(record.date)}</dd></div>
        </dl>
        <div className="mt-4 rounded-lg bg-white p-4 text-sm"><p className="mb-1 text-xs font-medium text-muted">Findings / notes</p><p className="whitespace-pre-line">{record.notes}</p></div>
        <p className="mt-3 text-xs text-muted">File: {record.fileName} · Sample document for demonstration.</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={async () => { try { const r = await downloadRecord(record); if (r.demo) toast(r.noFile ? 'This record has no attached file.' : `Download started: ${r.fileName} (demo)`, 'info') } catch (e) { toast(e.message, 'error') } }}><Download size={16} />Download</button>
      </div>
    </Modal>
  )
}
