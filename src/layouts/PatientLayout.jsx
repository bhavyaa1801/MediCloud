import { LayoutDashboard, Stethoscope, CalendarCheck, FileText, Pill, Bell, UserRound } from 'lucide-react'
import Shell from './Shell.jsx'
const nav = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/doctors', label: 'Find Doctors', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck }, { to: '/records', label: 'Medical Records', icon: FileText },
  { to: '/prescriptions', label: 'Prescriptions', icon: Pill }, { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My Profile', icon: UserRound },
]
export default () => <Shell nav={nav} base="/patient" roleLabel="Patient Portal" />
