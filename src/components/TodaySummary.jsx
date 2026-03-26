import { useState, useEffect } from 'react'
import { sumSessionsMs, toDecimalHours, toHoursMinutes } from '../utils/time'

export default function TodaySummary({ todaySessions, hoursFormat, onToggleFormat, isTodayOff }) {
  const [now, setNow] = useState(Date.now())

  const isCheckedIn = todaySessions.length > 0 && !todaySessions[todaySessions.length - 1].checkOut

  // Refresh every second while checked in, every 30s otherwise
  useEffect(() => {
    const ms = isCheckedIn ? 1000 : 30000
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [isCheckedIn])

  if (isTodayOff || todaySessions.length === 0) return null

  const totalMs = sumSessionsMs(todaySessions, now)
  const displayTotal = hoursFormat === 'hhmm' ? toHoursMinutes(totalMs) : toDecimalHours(totalMs)
  const sessionCount = todaySessions.length

  return (
    <div className="today-summary">
      <div className="today-total">{displayTotal}</div>
      <div className="today-label">
        hours today &middot; {sessionCount} session{sessionCount !== 1 ? 's' : ''}
      </div>
      <button className="format-toggle" onClick={onToggleFormat} title="Toggle hours format">
        {hoursFormat === 'decimal' ? '8:MM' : '8.25'}
      </button>
    </div>
  )
}
