import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import PatientLayout from './layouts/PatientLayout.jsx'
import DoctorLayout from './layouts/DoctorLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import Landing from './pages/public/Landing.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import Notifications from './pages/shared/Notifications.jsx'
import PatientDashboard from './pages/patient/Dashboard.jsx'
import FindDoctors from './pages/patient/FindDoctors.jsx'
import DoctorProfile from './pages/patient/DoctorProfile.jsx'
import BookAppointment from './pages/patient/BookAppointment.jsx'
import PatientAppointments from './pages/patient/Appointments.jsx'
import PatientRecords from './pages/patient/Records.jsx'
import PatientPrescriptions from './pages/patient/Prescriptions.jsx'
import PatientProfile from './pages/patient/Profile.jsx'
import DoctorDashboard from './pages/doctor/Dashboard.jsx'
import DoctorAppointments from './pages/doctor/Appointments.jsx'
import Schedule from './pages/doctor/Schedule.jsx'
import DoctorPatients from './pages/doctor/Patients.jsx'
import PatientDetail from './pages/doctor/PatientDetail.jsx'
import Consultation from './pages/doctor/Consultation.jsx'
import DoctorRecords from './pages/doctor/Records.jsx'
import DoctorPrescriptions from './pages/doctor/Prescriptions.jsx'
import DoctorOwnProfile from './pages/doctor/Profile.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminPatients from './pages/admin/Patients.jsx'
import AdminDoctors from './pages/admin/Doctors.jsx'
import Departments from './pages/admin/Departments.jsx'
import AdminAppointments from './pages/admin/Appointments.jsx'
import Resources from './pages/admin/Resources.jsx'
import Users from './pages/admin/Users.jsx'
import AuditLogs from './pages/admin/AuditLogs.jsx'
import Settings from './pages/admin/Settings.jsx'
import ReceptionLayout from './layouts/ReceptionLayout.jsx'
import ReceptionDashboard from './pages/reception/Dashboard.jsx'
import ReceptionBook from './pages/reception/Book.jsx'
import ReceptionDoctors from './pages/reception/Doctors.jsx'
import ReceptionProfile from './pages/reception/Profile.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/patient" element={<ProtectedRoute role="patient" />}>
        <Route element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="doctors" element={<FindDoctors />} />
          <Route path="doctors/:id" element={<DoctorProfile />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>
      </Route>

      <Route path="/doctor" element={<ProtectedRoute role="doctor" />}>
        <Route element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="consult/:id" element={<Consultation />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="records" element={<DoctorRecords />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<DoctorOwnProfile />} />
        </Route>
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="departments" element={<Departments />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="resources" element={<Resources />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/receptionist" element={<ProtectedRoute role="receptionist" />}>
        <Route element={<ReceptionLayout />}>
          <Route index element={<ReceptionDashboard />} />
          <Route path="patients" element={<AdminPatients canDeactivate={false} />} />
          <Route path="appointments" element={<AdminAppointments manageStatuses={['Pending', 'Confirmed', 'Cancelled']} />} />
          <Route path="book" element={<ReceptionBook />} />
          <Route path="doctors" element={<ReceptionDoctors />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ReceptionProfile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
