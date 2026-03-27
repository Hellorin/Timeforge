import { useState, useEffect } from 'react'
import { sumSessionsMs, toDecimalHours, toHoursMinutes } from '../utils/time'

function formatMsLeft(ms) {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function TodaySummary({ todaySessions, hoursFormat, onToggleFormat, isTodayOff, weekTargetMs, weekTotalOtherDaysMs }) {
  const [now, setNow] = useState(Date.now())

  const isCheckedIn = todaySessions.length > 0 && !todaySessions[todaySessions.length - 1].checkOut

  // Refresh every second while checked in, every 30s otherwise
  useEffect(() => {
    const ms = isCheckedIn ? 1000 : 30000
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [isCheckedIn])

  const showDaily = !isTodayOff && todaySessions.length > 0
  const showWeek = weekTargetMs > 0

  if (!showDaily && !showWeek) return null

  const totalMs = showDaily ? sumSessionsMs(todaySessions, now) : 0
  const displayTotal = hoursFormat === 'hhmm' ? toHoursMinutes(totalMs) : toDecimalHours(totalMs)
  const sessionCount = todaySessions.length

  // Live week remaining: all in ms, truncated to the minute for display
  const todayMs = isTodayOff ? 0 : totalMs
  const weekTotalMs = weekTotalOtherDaysMs + todayMs
  const weekRemainingMs = Math.max(0, weekTargetMs - weekTotalMs)
  const weekDone = weekRemainingMs === 0
  const weekPct = Math.min(100, weekTargetMs > 0 ? (weekTotalMs / weekTargetMs) * 100 : 0)

  return (
    <div className="today-summary">
      {showDaily && (
        <>
          <div className="today-total">{displayTotal}</div>
          <div className="today-label">
            hours today &middot; {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </div>
          <button className="format-toggle" onClick={onToggleFormat} title="Toggle hours format">
            {hoursFormat === 'decimal' ? '8:MM' : '8.25'}
          </button>
        </>
      )}

      {showWeek && (
        <div className={`week-remaining${showDaily ? ' week-remaining--with-separator' : ''}`}>
          {weekDone ? (
            <span className="week-remaining__done">Week complete!</span>
          ) : (
            <span className="week-remaining__label">
              <strong>{formatMsLeft(weekRemainingMs)}</strong> left this week
            </span>
          )}
          <div className="week-bar-track">
            <div
              className={`week-bar-fill${weekDone ? ' week-bar-fill--done' : ''}`}
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
