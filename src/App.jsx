import { useState, useEffect } from 'react'
import { useTimeTracker } from './hooks/useTimeTracker'
import SlideToggle from './components/SlideToggle'
import LiveTimer from './components/LiveTimer'
import TodaySummary from './components/TodaySummary'
import HistoryList from './components/HistoryList'
import CalendarView from './components/CalendarView'
import DayEditModal from './components/DayEditModal'
import CelebrationOverlay from './components/CelebrationOverlay'
import GlobalStatsPage from './components/GlobalStatsPage'
import HealthPage from './components/HealthPage'
import { formatDateKey, isWeekend } from './utils/time'

export default function App() {
  const { isCheckedIn, checkIn, checkOut, todaySessions, todayKey, allDays, setDaySessions, daysOff, toggleDayOff, isTodayOff, setMilestoneCallback, weekTargetMs, weekTotalOtherDaysMs, stats } = useTimeTracker()
  const [view, setView] = useState('tracker')
  const [selectedDay, setSelectedDay] = useState(null)
  const [hoursFormat, setHoursFormat] = useState(() => localStorage.getItem('hoursFormat') || 'decimal')
  const [celebrationMilestone, setCelebrationMilestone] = useState(null)

  useEffect(() => {
    setMilestoneCallback(type => setCelebrationMilestone(type))
    return () => setMilestoneCallback(null)
  }, [setMilestoneCallback])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isCheckedIn ? 'light' : 'dark')
    const color = isCheckedIn ? '#fffbf5' : '#1a1a2e'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [isCheckedIn])

  function toggleHoursFormat() {
    const next = hoursFormat === 'decimal' ? 'hhmm' : 'decimal'
    setHoursFormat(next)
    localStorage.setItem('hoursFormat', next)
  }

  return (
    <>
    <CelebrationOverlay
      milestone={celebrationMilestone}
      onDismiss={() => setCelebrationMilestone(null)}
    />
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Timeforge</h1>
        <p className="app-date">{formatDateKey(todayKey)}</p>
      </header>

      <main className="app-main">
        {view === 'tracker' && (
          <>
            <SlideToggle
              isCheckedIn={isCheckedIn}
              onCheckIn={checkIn}
              onCheckOut={checkOut}
              todaySessions={todaySessions}
              isTodayOff={isTodayOff}
            />
            <LiveTimer isCheckedIn={isCheckedIn} todaySessions={todaySessions} />
            <TodaySummary todaySessions={todaySessions} hoursFormat={hoursFormat} onToggleFormat={toggleHoursFormat} isTodayOff={isTodayOff} weekTargetMs={weekTargetMs} weekTotalOtherDaysMs={weekTotalOtherDaysMs} />
            <HistoryList allDays={allDays} todayKey={todayKey} hoursFormat={hoursFormat} daysOff={daysOff} />
          </>
        )}
        {view === 'calendar' && (
          <CalendarView
            allDays={allDays}
            daysOff={daysOff}
            onDayClick={(key, dayData) => setSelectedDay({ dateKey: key, sessions: dayData?.sessions ?? [] })}
          />
        )}
        {view === 'health' && <HealthPage stats={stats} allDays={allDays} daysOff={daysOff} />}
        {view === 'stats' && <GlobalStatsPage stats={stats} />}
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
          <span className="tab-icon">⏱️</span>
          <span className="tab-label">Track</span>
        </button>
        <button
          className={`tab-btn${view === 'calendar' ? ' tab-btn--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Calendar</span>
        </button>
        <button
            className={`tab-btn${view === 'health' ? ' tab-btn--active' : ''}`}
            onClick={() => setView('health')}
        >
          <span className="tab-icon">🫀</span>
          <span className="tab-label">Health</span>
        </button>
        <button
          className={`tab-btn${view === 'stats' ? ' tab-btn--active' : ''}`}
          onClick={() => setView('stats')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Stats</span>
        </button>
      </nav>
    </div>
    </>
  )
}
