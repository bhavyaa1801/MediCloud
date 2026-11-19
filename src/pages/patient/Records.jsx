import { useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import { DataTable, PageHeader, Select } from '../../components/common/index.jsx'
import RecordPreview from '../../components/records/RecordPreview.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getRecords } from '../../services/recordService.js'
import { fmtDate } from '../../utils/format.js'
import { downloadRecord } from '../../services/recordService.js'

export const RECORD_TYPES = ['Blood Report', 'MRI Report', 'X-Ray Report', 'Lab Report', 'Consultation Record']

export default function Records() {
  const { user } = useAuth()
  const { toast } = useApp()
  const [type, setType] = useState('')
  const [view, setView] = useState(null)
  const { data } = useData(() => getRecords({ patientId: user.profileId }), [user.profileId], [], ['records'])
  const rows = data.filter((r) => !type || r.type === type)
  return (
    <>
      <PageHeader title="Medical Records" subtitle="Your reports, scans and consultation notes." />
      <DataTable rows={rows} searchKeys={['name', 'type', 'doctorName']} toolbar={<Select className="w-48" value={type} onChange={setType} placeholder="All types" options={RECORD_TYPES} />} columns={[
        { label: 'Document', render: (r) => <span className="flex items-center gap-2 font-medium"><FileText size={16} className="text-brand" />{r.name}</span> },
        { label: 'Type', key: 'type' }, { label: 'Doctor', key: 'doctorName' }, { label: 'Date', render: (r) => fmtDate(r.date) },
        { label: 'Actions', render: (r) => <div className="flex gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setView(r)}><Eye size={14} />View</button><button className="btn btn-ghost btn-sm" onClick={async () => { try { const x = await downloadRecord(r); if (x.demo) toast(x.noFile ? 'This record has no attached file.' : `Download started: ${x.fileName} (demo)`, 'info') } catch (e) { toast(e.message, 'error') } }}><Download size={14} />Download</button></div> },
      ]} />
      <RecordPreview record={view} onClose={() => setView(null)} />
    </>
  )
}
