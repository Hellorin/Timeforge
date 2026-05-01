import { useState, useMemo, useEffect } from 'react'
import { formatDateKey, formatTime, toHoursMinutes, toDecimalHours, getWeekDays, sumSessionsMs } from '../utils/time'

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getWeekKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const weekDays = getWeekDays(new Date(y, m - 1, d))
  return toDateKey(weekDays[0])
}

function getWeekLabel(weekKey) {
  const [y, m, d] = weekKey.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = date => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function HistoryDay({ day, todayKey, hoursFormat }) {
  const isToday = day.date === todayKey
  const [expanded, setExpanded] = useState(isToday)
  const hasActiveSession = day.sessions.some(s => s.checkOut === null)

  return (
    <li className="history-day">
      <button
        className="history-day-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="history-date">
          {isToday ? 'Today' : formatDateKey(day.date)}
          {hasActiveSession && <span className="session-live-dot" aria-label="session in progress" />}
          {day.autoCheckedOut && (
            <span
              className="auto-checkout-badge"
              title="You likely forgot to check out — auto-closed at 21:00"
              aria-label="Auto-checked-out at 21:00; verify the hours are correct"
            >
              ⚠ auto
            </span>
          )}
        </span>
        <span className="history-total">{hoursFormat === 'hhmm' ? toHoursMinutes(day.totalMs) : day.totalDecimal}h</span>
        <span className="history-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="history-sessions">
          {day.sessions.map((session, i) => (
            <li key={i} className={`history-session${session.checkOut === null ? ' history-session--active' : ''}${session.autoCheckedOut ? ' history-session--auto' : ''}`}>
              <span>{formatTime(session.checkIn)}</span>
              <span className="session-arrow">→</span>
              <span>
                {session.checkOut ? formatTime(session.checkOut) : '...'}
                {session.autoCheckedOut && <span className="session-auto-flag" title="Auto-checked-out at 21:00"> ⚠</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function HistoryWeek({ weekKey, days, todayKey, hoursFormat, defaultExpanded, daysOff, isCurrentWeek }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const totalMs = days.reduce((sum, d) => sum + d.totalMs, 0)
  const label = getWeekLabel(weekKey)

  const [y, m, d] = weekKey.split('-').map(Number)
  const weekdays = getWeekDays(new Date(y, m - 1, d)).slice(0, 5)
  const daysOffCount = weekdays.filter(date => daysOff[toDateKey(date)]).length
  const weekTargetMs = (5 - daysOffCount) * 8 * 3600000

  let status = 'pending'
  if (weekTargetMs > 0) {
    if (totalMs >= weekTargetMs) status = 'success'
    else if (!isCurrentWeek) status = 'fail'
  }

  return (
    <li className={`history-week history-week--${status}`}>
      <button
        className="history-week-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="history-week-label">{label}</span>
        {status !== 'pending' && (
          <span
            className={`history-week-status history-week-status--${status}`}
            aria-label={status === 'success' ? 'Weekly target met' : 'Weekly target not met'}
          >
            {status === 'success' ? '✓' : '✗'}
          </span>
        )}
        <span className="history-total">{hoursFormat === 'hhmm' ? toHoursMinutes(totalMs) : toDecimalHours(totalMs)}h</span>
        <span className="history-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="history-days">
          {days.map(day => (
            <HistoryDay key={day.date} day={day} todayKey={todayKey} hoursFormat={hoursFormat} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function HistoryList({ allDays, todayKey, hoursFormat, daysOff = {} }) {
  const currentWeekKey = getWeekKey(todayKey)
  const [currentYear, currentMonth] = todayKey.split('-').map(Number)

  const historyDays = allDays.filter(d => !d.isOff)

  const hasActiveSession = historyDays.some(d => d.sessions.some(s => s.checkOut === null))
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!hasActiveSession) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasActiveSession])

  const liveDays = historyDays.map(day => {
    if (!day.sessions.some(s => s.checkOut === null)) return day
    const totalMs = sumSessionsMs(day.sessions, now)
    return { ...day, totalMs, totalDecimal: toDecimalHours(totalMs) }
  })

  const weekGroups = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    // Always include the current week, even when it spans into the previous
    // month and the user has no entries logged yet for the current month.
    // Also include weeks with logged data in the previous month so that, on
    // transition into a new month, the prior month's weeks remain visible
    // (including a week that started in the month before that but had days
    // in the previous month).
    const includedWeekKeys = new Set([currentWeekKey])
    for (const day of historyDays) {
      const [y, m] = day.date.split('-').map(Number)
      const inCurrentMonth = y === currentYear && m === currentMonth
      const inPreviousMonth = y === prevYear && m === prevMonth
      if (inCurrentMonth || inPreviousMonth) {
        includedWeekKeys.add(getWeekKey(day.date))
      }
    }

    // Group days by week, but only for weeks that touch the current or
    // previous month. This includes days from adjacent months that belong
    // to a qualifying week.
    const groups = new Map()
    for (const day of liveDays) {
      const wk = getWeekKey(day.date)
      if (includedWeekKeys.has(wk)) {
        if (!groups.has(wk)) groups.set(wk, [])
        groups.get(wk).push(day)
      }
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [historyDays, liveDays, currentYear, currentMonth, currentWeekKey])

  if (weekGroups.length === 0) return null

  return (
    <section className="history-section">
      <h2 className="history-title">History</h2>
      <ul className="history-weeks">
        {weekGroups.map(([weekKey, days]) => (
          <HistoryWeek
            key={weekKey}
            weekKey={weekKey}
            days={days}
            todayKey={todayKey}
            hoursFormat={hoursFormat}
            defaultExpanded={weekKey === currentWeekKey}
            daysOff={daysOff}
            isCurrentWeek={weekKey === currentWeekKey}
          />
        ))}
      </ul>
    </section>
  )
}
