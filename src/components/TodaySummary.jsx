import { useState, useEffect } from 'react'
import { sumSessionsMs, toDecimalHours, toHoursMinutes } from '../utils/time'

export default function TodaySummary({ todaySessions, hoursFormat, onToggleFormat, isTodayOff }) {
  const [now, setNow] = useState(Date.now())

  // Refresh every 30s to keep total up to date while checked in
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

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
