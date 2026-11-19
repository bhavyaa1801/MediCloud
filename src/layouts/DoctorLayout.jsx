import { LayoutDashboard, CalendarCheck, CalendarClock, Users, FileText, Pill, Bell, UserRound } from 'lucide-react'
import Shell from './Shell.jsx'
const nav = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/appointments', label: 'My Appointments', icon: CalendarCheck },
  { to: '/schedule', label: 'My Schedule', icon: CalendarClock }, { to: '/patients', label: 'Patients', icon: Users },
  { to: '/records', label: 'Medical Records', icon: FileText }, { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/notifications', label: 'Notifications', icon: Bell }, { to: '/profile', label: 'My Profile', icon: UserRound },
]
export default () => <Shell nav={nav} base="/doctor" roleLabel="Doctor Portal" />
