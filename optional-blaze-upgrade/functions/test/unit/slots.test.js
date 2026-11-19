const test = require('node:test'); const assert = require('node:assert')
const { buildSlots, isWorkingDate, minutesUntil, slotId, slotEnd } = require('../../src/lib/slots')

const doc = { status: 'active', workingHours: { start: '09:00', end: '12:00', breakStart: '10:00', breakEnd: '10:30' }, availability: { workingDays: [1, 2, 3, 4, 5], slotMinutes: 30, blockedDates: ['2030-01-09'] } }
const now = { date: '2030-01-01', minutes: 8 * 60 }    // Tue 2030-01-01 08:00

test('slots skip the break and respect length', () => {
  assert.deepStrictEqual(buildSlots(doc, '2030-01-02', now), ['09:00', '09:30', '10:30', '11:00', '11:30'])
})
test('weekends, blocked dates and past dates have no slots', () => {
  assert.deepStrictEqual(buildSlots(doc, '2030-01-05', now), [])   // Saturday
  assert.deepStrictEqual(buildSlots(doc, '2030-01-09', now), [])   // blocked
  assert.deepStrictEqual(buildSlots(doc, '2029-12-31', now), [])   // past
})
test('past times today are excluded', () => {
  assert.deepStrictEqual(buildSlots(doc, '2030-01-01', { date: '2030-01-01', minutes: 9 * 60 + 30 }), ['10:30', '11:00', '11:30'])
})
test('inactive doctor is never working', () => assert.strictEqual(isWorkingDate({ ...doc, status: 'inactive' }, '2030-01-02', now), false))
test('deterministic slot id and end time', () => { assert.strictEqual(slotId('DOC-01', '2030-01-02', '09:30'), 'DOC-01_2030-01-02_0930'); assert.strictEqual(slotEnd(doc, '09:30'), '10:00') })
test('minutesUntil', () => { assert.strictEqual(minutesUntil('2030-01-02', '09:00', now), 1440 + 60); assert.ok(minutesUntil('2030-01-01', '07:00', now) < 0) })
