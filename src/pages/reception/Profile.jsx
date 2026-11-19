import ProfileForm from '../shared/ProfileForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getStaff, updateStaff } from '../../services/staffService.js'
import { isPhone } from '../../utils/format.js'

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { toast } = useApp()
  const fields = [
    { key: 'name', label: 'Full name', validate: (v) => (v?.trim().length < 3 ? 'Enter your full name.' : '') },
    { key: 'email', label: 'Email', readOnly: true }, { key: 'phone', label: 'Phone', validate: (v) => (isPhone(v || '') ? '' : 'Enter a valid phone number.') },
  ]
  return <ProfileForm title="My Profile" subtitle="Your reception desk account." fields={fields} load={() => getStaff(user.profileId)} save={(f) => updateStaff(user.profileId, f)} onSaved={(p) => { updateSession({ name: p.name }); toast('Profile updated.') }} />
}
