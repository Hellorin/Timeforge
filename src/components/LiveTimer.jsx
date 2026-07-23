import { useState, useEffect } from 'react'
import { formatDuration } from '../utils/time'

export default function LiveTimer({ isCheckedIn, todaySessions }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isCheckedIn) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isCheckedIn])

  if (!isCheckedIn) return null

  const openSession = todaySessions[todaySessions.length - 1]
  if (!openSession) return null

  const elapsed = now - new Date(openSession.checkIn).getTime()

  return (
    <div className="live-timer" aria-live="polite" aria-atomic="true">
      <span className="live-dot" aria-hidden="true" />
      <span className="live-duration">{formatDuration(elapsed)}</span>
      <span className="live-label">current session</span>
    </div>
  )
}
