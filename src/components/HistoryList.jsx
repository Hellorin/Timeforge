import { useState } from 'react'
import { formatDateKey, formatTime, toHoursMinutes } from '../utils/time'

function HistoryDay({ day, todayKey, hoursFormat }) {
  const [expanded, setExpanded] = useState(false)
  const isToday = day.date === todayKey

  return (
    <li className="history-day">
      <button
        className="history-day-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="history-date">
          {isToday ? 'Today' : formatDateKey(day.date)}
        </span>
        <span className="history-total">{hoursFormat === 'hhmm' ? toHoursMinutes(day.totalMs) : day.totalDecimal}h</span>
        <span className="history-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="history-sessions">
          {day.sessions.map((session, i) => (
            <li key={i} className="history-session">
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

export default function HistoryList({ allDays, todayKey, hoursFormat }) {
  const currentMonthPrefix = todayKey.slice(0, 7) // "YYYY-MM"
  const historyDays = allDays.filter(d => d.date !== todayKey && d.date.startsWith(currentMonthPrefix))

  if (historyDays.length === 0) return null

  return (
    <section className="history-section">
      <h2 className="history-title">History</h2>
      <ul className="history-list">
        {historyDays.map(day => (
          <HistoryDay key={day.date} day={day} todayKey={todayKey} hoursFormat={hoursFormat} />
        ))}
      </ul>
    </section>
  )
}
