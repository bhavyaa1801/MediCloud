import { useState } from 'react'
import { DataTable, PageHeader, Select, StatusBadge } from '../../components/common/index.jsx'
import { useData } from '../../hooks/useData.js'
import { getAuditLogs } from '../../services/adminService.js'
import { fmtDateTime } from '../../utils/format.js'

export default function AuditLogs() {
  const { data } = useData(getAuditLogs, [], [])
  const [status, setStatus] = useState('')
  return (
    <>
      <PageHeader title="Audit Logs" subtitle="A record of important actions across the platform." />
      <DataTable rows={data.filter((l) => !status || l.status === status)} pageSize={10} searchKeys={['actor', 'action', 'resource']} toolbar={<Select className="w-36" value={status} onChange={setStatus} placeholder="All statuses" options={['Success', 'Failed']} />} columns={[
        { label: 'Actor', key: 'actor' }, { label: 'Action', key: 'action' }, { label: 'Resource', key: 'resource' },
        { label: 'Timestamp', render: (l) => fmtDateTime(l.timestamp) }, { label: 'Status', render: (l) => <StatusBadge status={l.status} /> },
      ]} />
    </>
  )
}
