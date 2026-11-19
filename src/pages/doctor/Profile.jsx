import ProfileForm from '../shared/ProfileForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getDoctor, updateDoctor } from '../../services/doctorService.js'
import { isEmail, isPhone } from '../../utils/format.js'
import { IS_MOCK } from '../../services/firebase.js'

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { toast } = useApp()
  const fields = [
    { key: 'name', label: 'Name', validate: (v) => (v?.trim().length < 5 ? 'Enter your full name.' : '') },
    { key: 'specialization', label: 'Specialization', validate: (v) => (v?.trim() ? '' : 'Required.') },
    { key: 'qualifications', label: 'Qualifications', validate: (v) => (v?.trim() ? '' : 'Required.') },
    { key: 'experience', label: 'Experience (years)', type: 'number', validate: (v) => (v >= 0 && v <= 60 ? '' : 'Enter 0–60.') },
    { key: 'fee', label: 'Consultation fee (₹)', type: 'number', validate: (v) => (v > 0 ? '' : 'Enter a valid fee.') },
    { key: 'phone', label: 'Phone', validate: (v) => (isPhone(v || '') ? '' : 'Enter a valid phone number.') },
    { key: 'email', label: 'Email', readOnly: !IS_MOCK, validate: (v) => (isEmail(v || '') ? '' : 'Enter a valid email.') },
    { key: 'bio', label: 'About', type: 'textarea', wide: true },
  ]
  return <ProfileForm title="My Profile" subtitle="This information is shown to patients." fields={fields}
    load={() => getDoctor(user.profileId)} save={(f) => updateDoctor(user.profileId, { name: f.name, specialization: f.specialization, qualifications: f.qualifications, experience: f.experience, fee: f.fee, phone: f.phone, email: f.email, bio: f.bio }, user.name)}
    onSaved={(d) => { updateSession({ name: d.name, email: d.email }); toast('Profile updated.') }} />
}
