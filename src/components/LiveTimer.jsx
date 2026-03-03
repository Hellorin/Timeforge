import { useState, useEffect } from 'react'
import { formatDuration } from '../utils/time'

export default function LiveTimer({ isCheckedIn, todaySessions }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isCheckedIn) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [isCheckedIn])

  if (!isCheckedIn) return null

  const openSession = todaySessions[todaySessions.length - 1]
  if (!openSession) return null

  const elapsed = Date.now() - new Date(openSession.checkIn).getTime()

  return (
    <div className="live-timer" aria-live="polite" aria-atomic="true">
      <span className="live-dot" aria-hidden="true" />
      <span className="live-duration">{formatDuration(elapsed)}</span>
      <span className="live-label">current session</span>
    </div>
  )
}
