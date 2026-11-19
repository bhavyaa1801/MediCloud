import { LayoutDashboard, Users, Stethoscope, Building2, CalendarCheck, BedDouble, ShieldCheck, Bell, ScrollText, Settings } from 'lucide-react'
import Shell from './Shell.jsx'
const nav = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/patients', label: 'Patients', icon: Users },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope }, { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck }, { to: '/resources', label: 'Hospital Resources', icon: BedDouble },
  { to: '/users', label: 'User Management', icon: ShieldCheck }, { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText }, { to: '/settings', label: 'Settings', icon: Settings },
]
export default () => <Shell nav={nav} base="/admin" roleLabel="Administration" />
