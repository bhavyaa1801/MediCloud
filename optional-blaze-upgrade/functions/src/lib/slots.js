'use strict'
// Server-side slot logic (authoritative). Mirrors the frontend's display logic in src/utils/schedule.js.
const TZ = process.env.HOSPITAL_TZ || 'Asia/Kolkata'
const mins = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10)
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function nowLocal(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) }
}
const dayOfWeek = (date) => new Date(date + 'T00:00:00Z').getUTCDay()
const dayDiff = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000)

function isWorkingDate(doc, date, now = nowLocal()) {
  const a = doc.availability || {}
  return doc.status === 'active' && (a.workingDays || []).includes(dayOfWeek(date)) && !(a.blockedDates || []).includes(date) && date >= now.date
}
function buildSlots(doc, date, now = nowLocal()) {
  if (!isWorkingDate(doc, date, now)) return []
  const { start, end, breakStart, breakEnd } = doc.workingHours
  const len = doc.availability.slotMinutes
  const out = []
  for (let m = mins(start); m + len <= mins(end); m += len) {
    const inBreak = breakStart && breakEnd && m < mins(breakEnd) && m + len > mins(breakStart)
    const past = date === now.date && m <= now.minutes
    if (!inBreak && !past) out.push(fmt(m))
  }
  return out
}
const slotEnd = (doc, time) => fmt(mins(time) + doc.availability.slotMinutes)
const slotId = (doctorId, date, time) => `${doctorId}_${date}_${time.replace(':', '')}`
// Minutes from now until the appointment starts (negative if in the past).
const minutesUntil = (date, time, now = nowLocal()) => dayDiff(date, now.date) * 1440 + mins(time) - now.minutes

module.exports = { nowLocal, dayOfWeek, isWorkingDate, buildSlots, slotEnd, slotId, minutesUntil, mins }
