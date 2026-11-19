import { useState } from 'react'
import { Bell, CalendarCheck, Pill, FileText, XCircle, UserPlus, BedDouble, Clock, CheckCheck } from 'lucide-react'
import { Card, EmptyState, PageHeader, Spinner, Tabs } from '../../components/common/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../hooks/useData.js'
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService.js'
import { fmtDateTime } from '../../utils/format.js'

const icons = { appointment: CalendarCheck, prescription: Pill, record: FileText, cancellation: XCircle, user: UserPlus, resource: BedDouble, reminder: Clock }

export default function Notifications() {
  const { user } = useAuth()
  const { toast } = useApp()
  const [tab, setTab] = useState('All')
  const { data, loading, reload } = useData(() => getNotifications(user.userId), [user.userId], [], ['notifications'])
  const list = tab === 'Unread' ? data.filter((n) => !n.read) : data
  const unread = data.filter((n) => !n.read).length
  return (
    <>
      <PageHeader title="Notifications" subtitle={`${unread} unread`} actions={<button className="btn btn-ghost" disabled={!unread} onClick={async () => { await markAllAsRead(user.userId); toast('All notifications marked as read.'); reload() }}><CheckCheck size={16} />Mark all as read</button>} />
      <div className="mb-4"><Tabs tabs={['All', 'Unread']} value={tab} onChange={setTab} /></div>
      <Card>
        {loading ? <Spinner /> : list.length === 0 ? <EmptyState title="You’re all caught up" /> : (
          <ul className="divide-y divide-slate-100">
            {list.map((n) => { const I = icons[n.type] || Bell; return (
              <li key={n.id} className={`flex gap-3 py-3 ${n.read ? '' : 'bg-brand/[0.03]'}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-slate-100 text-muted' : 'bg-brand/10 text-brand'}`}><I size={16} /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{n.title}{!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand" />}</p><p className="text-sm text-muted">{n.message}</p><p className="mt-0.5 text-xs text-muted">{fmtDateTime(n.createdAt)}</p></div>
                {!n.read && <button className="btn btn-ghost btn-sm self-start" onClick={async () => { await markAsRead(n.id); reload() }}>Mark read</button>}
              </li>) })}
          </ul>
        )}
      </Card>
    </>
  )
}
