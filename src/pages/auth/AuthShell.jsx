import { Link } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
export default function AuthShell({ title, subtitle, children, wide }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white"><HeartPulse size={20} /></span>MediCloud</Link>
        <div className="card p-6 sm:p-8"><h1 className="text-xl font-semibold">{title}</h1><p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>{children}</div>
      </div>
    </div>
  )
}
