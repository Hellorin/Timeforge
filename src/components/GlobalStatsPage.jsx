import StatCard from './stats/StatCard'
import DayOfWeekChart from './stats/DayOfWeekChart'
import MonthlyTotalsChart from './stats/MonthlyTotalsChart'
import YearOverYearChart from './stats/YearOverYearChart'
import ActivityHeatmap from './stats/ActivityHeatmap'
import { formatDateKey, decimalToHoursMinutes } from '../utils/time'

export default function GlobalStatsPage({ stats }) {
  if (!stats || stats.isEmpty) {
    return (
      <section className="stats-page stats-page--empty">
        <div className="stats-empty">
          <div className="stats-empty__icon">📊</div>
          <p className="stats-empty__title">No stats yet</p>
          <p className="stats-empty__sub">Start tracking to see your history come to life here.</p>
        </div>
      </section>
    )
  }

  const { totals, averages, streaks, charts } = stats
  const currentYear = new Date().getFullYear()
  const prevYear = currentYear - 1

  return (
    <section className="stats-page">
      <Section title="Lifetime totals">
        <div className="stats-grid">
          <StatCard label="Hours tracked" value={decimalToHoursMinutes(totals.totalHours)} />
          <StatCard label="Sessions" value={totals.totalSessions} />
          <StatCard label="Workdays" value={totals.workdaysLogged} />
          <StatCard label="Days off" value={totals.daysOffTaken} />
        </div>
        <p className="stats-footnote">
          Tracking since <strong>{formatDateKey(totals.firstTrackedKey)}</strong>
          {' · '}
          {totals.daysSinceStart} day{totals.daysSinceStart === 1 ? '' : 's'}
        </p>
      </Section>

      <Section title="Averages">
        <div className="stats-grid">
          <StatCard label="Per workday" value={decimalToHoursMinutes(averages.avgHoursPerWorkday)} />
          <StatCard label="Per week" value={decimalToHoursMinutes(averages.avgHoursPerWeek)} hint="completed weeks" />
          <StatCard label="Sessions / day" value={averages.avgSessionsPerWorkday} />
          <StatCard
            label="Typical hours"
            value={averages.typicalCheckIn && averages.typicalCheckOut
              ? `${averages.typicalCheckIn}–${averages.typicalCheckOut}`
              : '—'}
          />
        </div>
      </Section>

      <Section title="Streaks & goals">
        <div className="stats-grid">
          <StatCard label="Current streak" value={streaks.currentStreak} unit="d" />
          <StatCard label="Longest streak" value={streaks.longestStreak} unit="d" />
          <StatCard
            label="Weeks on target"
            value={streaks.completedWeeks > 0 ? `${streaks.weeksHit}/${streaks.completedWeeks}` : '—'}
            hint={streaks.completedWeeks > 0 ? `${streaks.weeksHitPct}%` : undefined}
          />
          <StatCard label="Longest day" value={decimalToHoursMinutes(streaks.longestDayHours)} />
          <StatCard label="Longest session" value={decimalToHoursMinutes(streaks.longestSessionHours)} />
        </div>
        <p className="stats-footnote">Weekly target is 8h per workday, reduced for days off. The current in-progress week is excluded from goal counts.</p>
      </Section>

      <Section title="Patterns">
        <DayOfWeekChart data={charts.dayOfWeek} />
        <MonthlyTotalsChart data={charts.monthly} />
        {charts.yearOverYear && (
          <YearOverYearChart
            data={charts.yearOverYear}
            currentYear={currentYear}
            prevYear={prevYear}
          />
        )}
        <ActivityHeatmap weeks={charts.heatmap} />
      </Section>
    </section>
  )
}

function Section({ title, children }) {
  return (
    <div className="stats-section">
      <h2 className="stats-section__title">{title}</h2>
      {children}
    </div>
  )
}
