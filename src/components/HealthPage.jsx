import { useMemo } from 'react'
import { computeRecentWeeklyAvg } from '../utils/stats'
import { decimalToHoursMinutes } from '../utils/time'

const STATUS_CONFIG = {
  'too-much': {
    icon: '😰',
    message: 'Take it easy, this is about your health',
    modifier: 'danger',
  },
  ok: {
    icon: '💚',
    message: 'Great, keep up the good work',
    modifier: 'ok',
  },
  'not-enough': {
    icon: '⚠️',
    message: "Maybe you should make sure you are doing enough and don't get in trouble",
    modifier: 'warn',
  },
}

export default function HealthPage({ stats, allDays, daysOff }) {
  const healthData = useMemo(() => {
    const days = Object.fromEntries(allDays.map(d => [d.date, d.sessions]))
    return computeRecentWeeklyAvg(days, daysOff)
  }, [allDays, daysOff])

  if (!stats || stats.isEmpty) {
    return (
      <section className="health-page health-page--empty">
        <div className="stats-empty">
          <div className="stats-empty__icon">🫀</div>
          <p className="stats-empty__title">No data yet</p>
          <p className="stats-empty__sub">Start tracking your hours to get health insights here.</p>
        </div>
      </section>
    )
  }

  const { recentAvgHours, weekCount, currentWeekHours, currentWeekTarget, status } = healthData
  const cfg = STATUS_CONFIG[status]
  const dailyAvg = stats.averages.avgHoursPerWorkday

  const avgLabel = weekCount > 0
    ? `Based on your last ${weekCount} completed week${weekCount > 1 ? 's' : ''}`
    : 'Based on your overall daily average'

  return (
    <section className="health-page">
      <div className={`health-status-card health-status-card--${cfg.modifier}`}>
        <div className="health-status-card__icon">{cfg.icon}</div>
        <p className="health-status-card__message">{cfg.message}</p>
        <p className="health-status-card__sub">{avgLabel}</p>
      </div>

      <div className="health-metrics">
        <HealthMetric
          label="This week"
          value={decimalToHoursMinutes(currentWeekHours)}
          sub={`of ${decimalToHoursMinutes(currentWeekTarget)} target`}
        />
        <HealthMetric
          label={weekCount > 0 ? `${weekCount}-week avg` : 'Avg / week'}
          value={decimalToHoursMinutes(recentAvgHours)}
          sub="per week"
        />
        <HealthMetric
          label="Daily avg"
          value={decimalToHoursMinutes(dailyAvg)}
          sub="per workday"
        />
      </div>

      <div className="health-guide">
        <p className="health-guide__title">What the thresholds mean</p>
        <ul className="health-guide__list">
          <li className="health-guide__item health-guide__item--ok">
            <span className="health-guide__dot" />
            <span><strong>On track</strong> — 100–112% of your weekly target (e.g. 40–45 h on a full week)</span>
          </li>
          <li className="health-guide__item health-guide__item--warn">
            <span className="health-guide__dot" />
            <span><strong>Under</strong> — below your weekly target. Could signal a risk.</span>
          </li>
          <li className="health-guide__item health-guide__item--danger">
            <span className="health-guide__dot" />
            <span><strong>Over</strong> — more than 112% of your target. Sustained overtime can hurt.</span>
          </li>
        </ul>
      </div>
    </section>
  )
}

function HealthMetric({ label, value, sub }) {
  return (
    <div className="health-metric">
      <span className="health-metric__value">{value}</span>
      <span className="health-metric__label">{label}</span>
      <span className="health-metric__sub">{sub}</span>
    </div>
  )
}
