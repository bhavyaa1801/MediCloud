import { LayoutDashboard, Users, CalendarCheck, CalendarPlus, Stethoscope, Bell, UserRound } from 'lucide-react'
import Shell from './Shell.jsx'
const nav = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck }, { to: '/book', label: 'Book Appointment', icon: CalendarPlus },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope }, { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My Profile', icon: UserRound },
]
export default () => <Shell nav={nav} base="/receptionist" roleLabel="Reception Desk" />
