export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
export const addDaysISO = (n, from = todayISO()) => { const d = new Date(from + 'T00:00:00'); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const mins = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10)
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const isWorkingDate = (doc, date) => {
  const day = new Date(date + 'T00:00:00').getDay()
  return doc.status === 'active' && doc.workingDays.includes(day) && !doc.blockedDates.includes(date) && date >= todayISO()
}
export function buildSlots(doc, date) {
  if (!isWorkingDate(doc, date)) return []
  const out = []
  for (let m = mins(doc.start); m + doc.slotMinutes <= mins(doc.end); m += doc.slotMinutes) {
    const overlapsBreak = doc.breakStart && doc.breakEnd && m < mins(doc.breakEnd) && m + doc.slotMinutes > mins(doc.breakStart)
    if (!overlapsBreak) out.push(fmt(m))
  }
  return out
}
