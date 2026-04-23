import { useState } from 'react'
import { getTodayKey, isWeekend } from '../utils/time'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function buildCalendarRows(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // ISO: Monday = 1, Sunday = 7; JS: Sunday = 0, Monday = 1
  const firstDow = firstDay.getDay() // 0=Sun..6=Sat
  // Steps back to Monday: if firstDow=0 (Sun), go back 6; if 1 (Mon), go back 0
  const stepsBack = firstDow === 0 ? 6 : firstDow - 1

  const start = new Date(firstDay)
  start.setDate(start.getDate() - stepsBack)

  const cells = []
  const cursor = new Date(start)
  // Always 6 rows × 7 = 42 cells
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  // Chunk into rows of 7
  const rows = []
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7))
  }
  return { rows, firstDay, lastDay }
}

function weekColor(totalMs, targetMs) {
  if (totalMs >= targetMs) return 'var(--accent-in)'
  if (totalMs >= targetMs * 0.75) return '#fbbf24'
  if (totalMs > 0) return 'var(--accent-out)'
  return null
}

export default function CalendarView({ allDays, onDayClick, daysOff = {} }) {
  const today = getTodayKey()
  const [year, month] = (() => {
    const d = new Date()
    return [d.getFullYear(), d.getMonth()]
  })()
  const [currentMonth, setCurrentMonth] = useState({ year, month })
  const [hoveredDay, setHoveredDay] = useState(null)

  const dayMap = new Map(allDays.map(d => [d.date, d]))

  const { rows, firstDay, lastDay } = buildCalendarRows(
    currentMonth.year,
    currentMonth.month
  )

  function prevMonth() {
    setCurrentMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 }
      return { year, month: month - 1 }
    })
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 }
      return { year, month: month + 1 }
    })
  }

  return (
    <div className="cal-container">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className="cal-month-label">
          {getMonthLabel(currentMonth.year, currentMonth.month)}
        </span>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
      </div>

      <div className="cal-grid">
        {/* Header row */}
        <div className="cal-header-row">
          {DAY_LABELS.map(d => (
            <div key={d} className="cal-header-cell">{d}</div>
          ))}
          <div className="cal-header-cell cal-week-header">Week</div>
        </div>

        {/* Day rows */}
        {rows.map((row, ri) => {
          // Use raw ms for both comparison and display to match the track page
          const weekTotalMs = row.reduce((sum, date) => {
            const key = toDateKey(date)
            return sum + (dayMap.get(key)?.totalMs ?? 0)
          }, 0)
          const weekTotal = weekTotalMs / 3600000
          // row[0..4] = Mon–Fri; only weekdays count toward target
          const daysOffCount = row.slice(0, 5).filter(d => daysOff[toDateKey(d)]).length
          const weekTarget = (5 - daysOffCount) * 8

          // For the current week, prorate the target based on workdays elapsed so far
          const isCurrentWeek = row.some(date => toDateKey(date) === today)
          let effectiveTarget = weekTarget
          if (isCurrentWeek) {
            const daysElapsed = row.slice(0, 5).filter(d => {
              const key = toDateKey(d)
              return !daysOff[key] && !isWeekend(key) && key <= today
            }).length
            effectiveTarget = daysElapsed * 8
          }

          const effectiveTargetMs = effectiveTarget * 3600000
          const weekTargetMs = weekTarget * 3600000
          const color = weekColor(weekTotalMs, effectiveTargetMs)
          const pct = weekTargetMs > 0 ? Math.min((weekTotalMs / weekTargetMs) * 100, 100) : 0

          return (
            <div key={ri} className="cal-row">
              {row.map(date => {
                const key = toDateKey(date)
                const isCurrentMonth = date >= firstDay && date <= lastDay
                const isToday = key === today
                const dayData = dayMap.get(key)
                const isDayOff = !!daysOff[key] || isWeekend(key)
                const hasSessions = !isDayOff && dayData && dayData.sessions.length > 0

                const autoCheckedOut = !isDayOff && !!dayData?.autoCheckedOut

                let cls = 'cal-day'
                if (!isCurrentMonth) cls += ' cal-day--other-month'
                if (isToday) cls += ' cal-day--today'
                if (hasSessions) cls += ' cal-day--has-sessions'
                if (isDayOff) cls += ' cal-day--day-off'
                if (autoCheckedOut) cls += ' cal-day--auto-checkout'

                return (
                  <div
                    key={key}
                    className={cls}
                    onClick={() => onDayClick(key, dayData ?? null)}
                    onMouseEnter={() => hasSessions && setHoveredDay(key)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <span className="cal-day-num">{date.getDate()}</span>
                    {isDayOff && <span className="cal-day-off-badge">off</span>}
                    {!isDayOff && hasSessions && <span className="cal-day-dot" />}
                    {autoCheckedOut && (
                      <span
                        className="cal-day-warn"
                        aria-label="Auto-checked-out — verify hours"
                        title="Auto-checked-out at 21:00"
                      >⚠</span>
                    )}
                    {hasSessions && hoveredDay === key && (
                      <div className="cal-day-tooltip">
                        <strong>{dayData.totalDecimal.toFixed(1)}h</strong>
                        <span> · {dayData.sessions.length} session{dayData.sessions.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Week summary */}
              <div className="cal-week-summary">
                {weekTotal > 0 ? (
                  <>
                    <div className="cal-week-total" style={{ color: color ?? 'var(--text-muted)' }}>
                      {weekTotal.toFixed(1)}h
                    </div>
                    <div className="cal-week-sub">/ {weekTarget}h</div>
                    <div className="cal-week-bar-track">
                      <div
                        className="cal-week-bar-fill"
                        style={{ width: `${pct}%`, background: color ?? 'var(--text-muted)' }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="cal-week-empty">--</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
