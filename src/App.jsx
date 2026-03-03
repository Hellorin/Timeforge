import { useTimeTracker } from './hooks/useTimeTracker'
import ActionButton from './components/ActionButton'
import LiveTimer from './components/LiveTimer'
import TodaySummary from './components/TodaySummary'
import HistoryList from './components/HistoryList'
import { formatDateKey } from './utils/time'

export default function App() {
  const { isCheckedIn, checkIn, checkOut, todaySessions, todayKey, allDays } = useTimeTracker()

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Timeforge</h1>
        <p className="app-date">{formatDateKey(todayKey)}</p>
      </header>

      <main className="app-main">
        <ActionButton
          isCheckedIn={isCheckedIn}
          onCheckIn={checkIn}
          onCheckOut={checkOut}
          todaySessions={todaySessions}
        />

        <LiveTimer isCheckedIn={isCheckedIn} todaySessions={todaySessions} />

        <TodaySummary todaySessions={todaySessions} />

        <HistoryList allDays={allDays} todayKey={todayKey} />
      </main>
    </div>
  )
}
