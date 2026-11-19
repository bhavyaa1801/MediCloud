import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse, Menu, X, CalendarCheck, FileText, Pill, BedDouble, BarChart3, ShieldCheck, Stethoscope, Heart, Brain, Baby, Bone, Siren, Sparkles, Activity, Phone, Mail, MapPin, CheckCircle2, UserPlus, Search, ClipboardCheck } from 'lucide-react'

const features = [
  [CalendarCheck, 'Smart appointments', 'Real-time availability, instant booking and easy rescheduling.'],
  [FileText, 'Digital records', 'Reports, scans and consultation notes stored in one secure place.'],
  [Pill, 'E-prescriptions', 'Doctors issue prescriptions that reach patients immediately.'],
  [BedDouble, 'Resource tracking', 'Rooms, beds and equipment managed without conflicts.'],
  [BarChart3, 'Hospital analytics', 'Live dashboards for admissions, load and departments.'],
  [ShieldCheck, 'Role-based access', 'Separate portals for patients, doctors and administrators.'],
]
const services = [[Stethoscope, 'General Consultation'], [Heart, 'Cardiac Care'], [Brain, 'Neurology'], [Baby, 'Child Health'], [Bone, 'Orthopedic Care'], [Siren, 'Emergency Services']]
const depts = ['General Medicine', 'Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Emergency Medicine']
const steps = [[UserPlus, 'Create your account', 'Register in under a minute as a patient.'], [Search, 'Find a specialist', 'Search by department, specialization or availability.'], [CalendarCheck, 'Book a slot', 'Pick a date and an open time slot.'], [ClipboardCheck, 'Get care & records', 'Receive prescriptions and reports online.']]
const why = ['One platform for patients, doctors and administrators', 'Consistent, up-to-date data across every dashboard', 'Built on a cloud-ready architecture', 'Clear audit trail of important actions']

export default function Landing() {
  const [open, setOpen] = useState(false)
  const links = [['Home', '#home'], ['Services', '#services'], ['About', '#about'], ['Contact', '#contact']]
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#home" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white"><HeartPulse size={18} /></span>MediCloud</a>
          <nav className="hidden items-center gap-8 md:flex">{links.map(([l, h]) => <a key={l} href={h} className="text-sm font-medium text-muted hover:text-brand">{l}</a>)}</nav>
          <div className="hidden items-center gap-2 md:flex"><Link to="/login" className="btn btn-ghost">Login</Link><Link to="/register" className="btn btn-primary">Sign Up</Link></div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && <div className="space-y-1 border-t border-slate-100 p-4 md:hidden">{links.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">{l}</a>)}<div className="flex gap-2 pt-2"><Link to="/login" className="btn btn-ghost flex-1">Login</Link><Link to="/register" className="btn btn-primary flex-1">Sign Up</Link></div></div>}
      </header>

      <section id="home" className="bg-gradient-to-b from-surface to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"><Sparkles size={12} />Cloud-based hospital management</span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Better Healthcare. <span className="text-brand">Smarter Management.</span></h1>
            <p className="mt-4 max-w-lg text-muted">MediCloud connects patients, doctors and hospital administrators on one platform — from booking an appointment to managing prescriptions, records and hospital resources.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link to="/register" className="btn btn-primary px-6 py-3">Get Started</Link><Link to="/login" className="btn btn-ghost px-6 py-3">Try a demo</Link></div>
            <div className="mt-8 flex gap-8 text-sm"><div><p className="text-2xl font-bold">10+</p><p className="text-muted">Specialists</p></div><div><p className="text-2xl font-bold">8</p><p className="text-muted">Departments</p></div><div><p className="text-2xl font-bold">24/7</p><p className="text-muted">Online booking</p></div></div>
          </div>
          <div className="relative">
            <div className="card space-y-4 p-5 shadow-xl">
              <div className="flex items-center justify-between"><p className="font-semibold">Today’s overview</p><Activity size={18} className="text-brand" /></div>
              <div className="grid grid-cols-3 gap-3">{[['Appointments', '24', 'text-brand'], ['Patients', '1,284', 'text-accent'], ['Rooms free', '12', 'text-success']].map(([l, v, c]) => <div key={l} className="rounded-xl bg-surface p-3"><p className="text-xs text-muted">{l}</p><p className={`text-lg font-bold ${c}`}>{v}</p></div>)}</div>
              {[['Dr. Priya Nair', 'Cardiology', '10:30 AM'], ['Dr. Sameer Khan', 'Neurology', '11:00 AM'], ['Dr. Kavya Iyer', 'Pediatrics', '02:30 PM']].map(([n, d, t]) => (
                <div key={n} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">{n.split(' ')[1][0]}{n.split(' ')[2][0]}</div><div><p className="text-sm font-medium">{n}</p><p className="text-xs text-muted">{d}</p></div></div><span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16"><h2 className="text-center text-3xl font-bold">Everything your hospital needs</h2><p className="mx-auto mt-2 max-w-xl text-center text-muted">A complete toolkit for modern care delivery and administration.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map(([I, t, d]) => <div key={t} className="card p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><I size={20} /></div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div></section>

      <section id="services" className="bg-surface py-16"><div className="mx-auto max-w-6xl px-4"><h2 className="text-center text-3xl font-bold">Healthcare services</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">{services.map(([I, t]) => <div key={t} className="card flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><I size={20} /></div><span className="text-sm font-medium">{t}</span></div>)}</div>
        <h3 className="mt-12 text-center text-xl font-semibold">Our departments</h3>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{depts.map((d) => <span key={d} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm">{d}</span>)}</div></div></section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16"><h2 className="text-center text-3xl font-bold">How MediCloud works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([I, t, d], i) => <div key={t} className="text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"><I size={20} /></div><p className="text-xs font-semibold text-brand">STEP {i + 1}</p><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div></section>

      <section className="bg-surface py-16"><div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2"><div><h2 className="text-3xl font-bold">Why choose MediCloud</h2><p className="mt-2 text-muted">Designed to reduce paperwork and give every role the right view of the hospital.</p></div>
        <ul className="space-y-3">{why.map((w) => <li key={w} className="card flex items-center gap-3 p-4 text-sm"><CheckCircle2 className="shrink-0 text-success" size={18} />{w}</li>)}</ul></div></section>

      <footer id="contact" className="bg-ink text-slate-300"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div><p className="flex items-center gap-2 text-lg font-bold text-white"><HeartPulse size={20} />MediCloud</p><p className="mt-2 text-sm">Better healthcare through smarter management.</p></div>
        <div><p className="mb-2 font-semibold text-white">Navigate</p>{links.map(([l, h]) => <a key={l} href={h} className="block text-sm hover:text-white">{l}</a>)}</div>
        <div><p className="mb-2 font-semibold text-white">Portal</p><Link to="/login" className="block text-sm hover:text-white">Login</Link><Link to="/register" className="block text-sm hover:text-white">Patient sign up</Link></div>
        <div className="space-y-2 text-sm"><p className="font-semibold text-white">Contact</p><p className="flex gap-2"><Phone size={14} className="mt-0.5" />+91 11 4000 1234</p><p className="flex gap-2"><Mail size={14} className="mt-0.5" />info@MediCloud.demo</p><p className="flex gap-2"><MapPin size={14} className="mt-0.5" />21 Health Avenue, New Delhi</p></div></div>
        <p className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} MediCloud. Demo project — all data is fictional.</p></footer>
    </div>
  )
}
