import { useState, useMemo } from 'react'
import { formatDateKey, formatTime, toHoursMinutes, toDecimalHours, getWeekDays } from '../utils/time'

function getWeekKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const weekDays = getWeekDays(new Date(y, m - 1, d))
  const mon = weekDays[0]
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`
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
        </span>
        <span className="history-total">{hoursFormat === 'hhmm' ? toHoursMinutes(day.totalMs) : day.totalDecimal}h</span>
        <span className="history-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="history-sessions">
          {day.sessions.map((session, i) => (
            <li key={i} className={`history-session${session.checkOut === null ? ' history-session--active' : ''}`}>
              <span>{formatTime(session.checkIn)}</span>
              <span className="session-arrow">→</span>
              <span>{session.checkOut ? formatTime(session.checkOut) : '...'}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function HistoryWeek({ weekKey, days, todayKey, hoursFormat, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const totalMs = days.reduce((sum, d) => sum + d.totalMs, 0)
  const label = getWeekLabel(weekKey)

  return (
    <li className="history-week">
      <button
        className="history-week-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="history-week-label">{label}</span>
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

export default function HistoryList({ allDays, todayKey, hoursFormat }) {
  const currentMonthPrefix = todayKey.slice(0, 7)
  const currentWeekKey = getWeekKey(todayKey)

  const historyDays = allDays.filter(d => d.date.startsWith(currentMonthPrefix) && !d.isOff)

  const weekGroups = useMemo(() => {
    const groups = new Map()
    for (const day of historyDays) {
      const wk = getWeekKey(day.date)
      if (!groups.has(wk)) groups.set(wk, [])
      groups.get(wk).push(day)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [historyDays])

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
          />
        ))}
      </ul>
    </section>
  )
}
