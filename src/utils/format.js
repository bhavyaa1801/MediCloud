export const fmtDate = (d) => (d ? new Date(d.length > 10 ? d : d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
export const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isPhone = (v) => /^[+\d][\d\s-]{8,15}$/.test(v)
export const initials = (n) => n.replace('Dr. ', '').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()
