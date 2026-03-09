import { useState, useEffect } from 'react'
import { sumSessionsMs, toDecimalHours } from '../utils/time'

export default function TodaySummary({ todaySessions }) {
  const [now, setNow] = useState(Date.now())

  // Refresh every 30s to keep total up to date while checked in
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  if (todaySessions.length === 0) return null

  const totalMs = sumSessionsMs(todaySessions, now)
  const decimal = toDecimalHours(totalMs)
  const sessionCount = todaySessions.length

  return (
    <div className="today-summary">
      <div className="today-total">{decimal}</div>
      <div className="today-label">
        hours today &middot; {sessionCount} session{sessionCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
