import ProfileForm from '../shared/ProfileForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getPatient, updatePatient } from '../../services/patientService.js'
import { isPhone } from '../../utils/format.js'

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { toast } = useApp()
  const fields = [
    { key: 'name', label: 'Full name', validate: (v) => (v?.trim().length < 3 ? 'Enter your full name.' : '') },
    { key: 'email', label: 'Email', readOnly: true }, { key: 'phone', label: 'Phone', validate: (v) => (isPhone(v || '') ? '' : 'Enter a valid phone number.') },
    { key: 'dob', label: 'Date of birth', type: 'date' }, { key: 'gender', label: 'Gender', options: ['Female', 'Male', 'Other'] },
    { key: 'bloodGroup', label: 'Blood group', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { key: 'emergencyContact', label: 'Emergency contact' }, { key: 'address', label: 'Address', type: 'textarea', wide: true },
  ]
  return <ProfileForm title="My Profile" subtitle="Keep your personal information up to date." fields={fields}
    load={() => getPatient(user.profileId)} save={(f) => updatePatient(user.profileId, f, user.name)}
    onSaved={(p) => { updateSession({ name: p.name }); toast('Profile updated.') }} />
}
