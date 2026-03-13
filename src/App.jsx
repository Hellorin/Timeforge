import { useState } from 'react'
import { useTimeTracker } from './hooks/useTimeTracker'
import ActionButton from './components/ActionButton'
import LiveTimer from './components/LiveTimer'
import TodaySummary from './components/TodaySummary'
import HistoryList from './components/HistoryList'
import CalendarView from './components/CalendarView'
import DayEditModal from './components/DayEditModal'
import { formatDateKey, isWeekend } from './utils/time'

export default function App() {
  const { isCheckedIn, checkIn, checkOut, todaySessions, todayKey, allDays, setDaySessions, daysOff, toggleDayOff, isTodayOff } = useTimeTracker()
  const [view, setView] = useState('tracker')
  const [selectedDay, setSelectedDay] = useState(null)
  const [hoursFormat, setHoursFormat] = useState(() => localStorage.getItem('hoursFormat') || 'decimal')

  function toggleHoursFormat() {
    const next = hoursFormat === 'decimal' ? 'hhmm' : 'decimal'
    setHoursFormat(next)
    localStorage.setItem('hoursFormat', next)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Timeforge</h1>
        <p className="app-date">{formatDateKey(todayKey)}</p>
      </header>

      <main className="app-main">
        {view === 'tracker' ? (
          <>
            <ActionButton
              isCheckedIn={isCheckedIn}
              onCheckIn={checkIn}
              onCheckOut={checkOut}
              todaySessions={todaySessions}
              isTodayOff={isTodayOff}
            />
            <LiveTimer isCheckedIn={isCheckedIn} todaySessions={todaySessions} />
            <TodaySummary todaySessions={todaySessions} hoursFormat={hoursFormat} onToggleFormat={toggleHoursFormat} />
            <HistoryList allDays={allDays} todayKey={todayKey} hoursFormat={hoursFormat} />
          </>
        ) : (
          <CalendarView
            allDays={allDays}
            daysOff={daysOff}
            onDayClick={(key, dayData) => setSelectedDay({ dateKey: key, sessions: dayData?.sessions ?? [] })}
          />
        )}
      </main>

      {selectedDay && (
        <DayEditModal
          dateKey={selectedDay.dateKey}
          sessions={selectedDay.sessions}
          onSave={(dateKey, sessions) => { setDaySessions(dateKey, sessions); setSelectedDay(null) }}
          onClose={() => setSelectedDay(null)}
          isDayOff={(daysOff[selectedDay.dateKey] ?? false) || isWeekend(selectedDay.dateKey)}
          onToggleDayOff={() => toggleDayOff(selectedDay.dateKey)}
        />
      )}

      <nav className="tab-bar">
        <button
          className={`tab-btn${view === 'tracker' ? ' tab-btn--active' : ''}`}
          onClick={() => setView('tracker')}
        >
          <span className="tab-icon">⏱</span>
          <span className="tab-label">Track</span>
        </button>
        <button
          className={`tab-btn${view === 'calendar' ? ' tab-btn--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Calendar</span>
        </button>
      </nav>
    </div>
  )
}
