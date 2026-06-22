export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function toDateKey(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isSameDay(a, b) {
  if (!a || !b) return false
  return toDateKey(a) === toDateKey(b)
}

export function isDateInRange(date, start, end) {
  if (!start || !end) return false
  const key = toDateKey(date)
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)
  return key >= startKey && key <= endKey
}

export function formatDateRange(start, end) {
  if (!start) return ''
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  const startLabel = start.toLocaleDateString(undefined, options)
  if (!end || isSameDay(start, end)) return startLabel
  const endLabel = end.toLocaleDateString(undefined, options)
  return `${startLabel} – ${endLabel}`
}

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const days = []

  for (let i = 0; i < startOffset; i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}
