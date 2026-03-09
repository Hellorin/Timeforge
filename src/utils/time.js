/**
 * Returns today's date key in "YYYY-MM-DD" format using local time.
 */
export function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Converts milliseconds to decimal hours rounded to the nearest quarter-hour.
 * e.g. 8h15m → 8.25, 8h30m → 8.5, 8h45m → 8.75
 */
export function toDecimalHours(ms) {
  const totalMinutes = ms / 1000 / 60
  const quarters = Math.round(totalMinutes / 15)
  return quarters / 4
}

/**
 * Sums all sessions for a day in milliseconds.
 * Open sessions (checkOut === null) are counted up to now.
 */
export function sumSessionsMs(sessions, now = Date.now()) {
  return sessions.reduce((total, session) => {
    const start = new Date(session.checkIn).getTime()
    const end = session.checkOut ? new Date(session.checkOut).getTime() : now
    return total + Math.max(0, end - start)
  }, 0)
}

/**
 * Converts milliseconds to "HH:MM" string (floor, no rounding).
 * e.g. 8h15m → "8:15"
 */
export function toHoursMinutes(ms) {
  const totalMinutes = Math.floor(ms / 1000 / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Formats milliseconds as HH:MM:SS for the live timer.
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Formats a date key "YYYY-MM-DD" into a human-readable string.
 * e.g. "2026-03-03" → "Tue, Mar 3, 2026"
 */
export function formatDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats an ISO timestamp as a local time string, e.g. "09:03".
 */
export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}
