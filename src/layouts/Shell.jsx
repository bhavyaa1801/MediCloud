import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { Bell, Menu, X, LogOut, HeartPulse, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Avatar } from '../components/common/index.jsx'
import { useData } from '../hooks/useData.js'
import { getNotifications } from '../services/notificationService.js'
import { useLocation } from 'react-router-dom'

export default function Shell({ nav, base, roleLabel }) {
  const { user, logout } = useAuth()
  const { toast } = useApp()
  const navigate = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const { data: notes } = useData(() => getNotifications(user.userId), [user.userId, loc.pathname], [], ['notifications'])
  const unread = notes.filter((n) => !n.read).length
  const doLogout = () => { logout(); toast('You have been logged out.', 'info'); navigate('/login') }

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white">
      <Link to="/" className="flex items-center gap-2 px-5 py-5 text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white"><HeartPulse size={18} /></span>MediCloud</Link>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{roleLabel}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={`${base}${to}`} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-slate-50 hover:text-ink'}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <button onClick={doLogout} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"><LogOut size={18} />Logout</button>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">{Sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} /><div className="relative h-full w-64">{Sidebar}</div></div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="hidden text-sm text-muted lg:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="flex items-center gap-2">
            <Link to={`${base}/notifications`} className="relative rounded-lg p-2 text-muted hover:bg-slate-100" aria-label="Notifications">
              <Bell size={20} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unread}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">
                <Avatar name={user.name} size={32} /><div className="hidden text-left sm:block"><p className="text-sm font-medium leading-tight">{user.name}</p><p className="text-xs capitalize text-muted">{user.role}</p></div><ChevronDown size={14} className="text-muted" />
              </button>
              {menu && (
                <div className="card absolute right-0 z-30 mt-2 w-44 p-1 shadow-lg" onMouseLeave={() => setMenu(false)}>
                  {user.role !== 'admin' && <Link to={`${base}/profile`} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">My Profile</Link>}
                  <button onClick={doLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10">Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      </div>
    </div>
  )
}
