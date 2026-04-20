import StatCard from './stats/StatCard'
import MonthlyTotalsChart from './stats/MonthlyTotalsChart'
import ActivityHeatmap from './stats/ActivityHeatmap'
import { decimalToHoursMinutes } from '../utils/time'

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

  return (
    <section className="stats-page">
      <Section title="Summary">
        <div className="stats-grid">
          <StatCard label="Hours tracked" value={decimalToHoursMinutes(totals.totalHours)} />
          <StatCard label="Workdays" value={totals.workdaysLogged} />
          <StatCard label="Per workday" value={decimalToHoursMinutes(averages.avgHoursPerWorkday)} />
          <StatCard label="Current streak" value={streaks.currentStreak} unit="d" />
          <StatCard
            label="Weeks on target"
            value={streaks.completedWeeks > 0 ? `${streaks.weeksHit}/${streaks.completedWeeks}` : '—'}
            hint={streaks.completedWeeks > 0 ? `${streaks.weeksHitPct}%` : undefined}
          />
        </div>
      </Section>

      <Section title="Patterns">
        <MonthlyTotalsChart data={charts.monthly} />
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
