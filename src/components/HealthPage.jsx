import { useMemo, useState } from 'react'
import { computeRecentWeeklyAvg } from '../utils/stats'
import { decimalToHoursMinutes } from '../utils/time'
import { computeProratedAllowance, computeAccruedDays, formatHolidayDays } from '../utils/holidays'

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

export default function HealthPage({ stats, allDays, daysOff, personalDaysUsedThisYear, annualHolidayAllowance, onSetAnnualHolidayAllowance, employmentStartDate, onSetEmploymentStartDate }) {
  const healthData = useMemo(() => {
    const days = Object.fromEntries(allDays.map(d => [d.date, d.sessions]))
    return computeRecentWeeklyAvg(days, daysOff)
  }, [allDays, daysOff])

  const holidayCard = (
    <HolidayBalanceCard
      used={personalDaysUsedThisYear}
      allowance={annualHolidayAllowance}
      onAllowanceChange={onSetAnnualHolidayAllowance}
      startDate={employmentStartDate}
      onStartDateChange={onSetEmploymentStartDate}
    />
  )

  if (!stats || stats.isEmpty) {
    return (
      <section className="health-page health-page--empty">
        {holidayCard}
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
      {holidayCard}

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

function HolidayBalanceCard({ used, allowance, onAllowanceChange, startDate, onStartDateChange }) {
  const [showSettings, setShowSettings] = useState(false)
  const today = new Date()
  const year = today.getFullYear()
  const proratedAllowance = computeProratedAllowance(startDate, allowance, year)
  const accrued = computeAccruedDays(startDate, allowance, today)
  const isProrated = startDate && proratedAllowance !== allowance
  const available = accrued - used
  const overspent = available < 0
  const pct = accrued > 0 ? Math.min(100, (used / accrued) * 100) : 0

  return (
    <div className={`holiday-card${overspent ? ' holiday-card--over' : ''}`}>
      <div className="holiday-card__header">
        <span className="holiday-card__title">Holiday balance</span>
        <span className="holiday-card__year">{year}</span>
      </div>
      <div className="holiday-card__numbers">
        <span className="holiday-card__used">{formatHolidayDays(Math.max(0, available))}</span>
        <span className="holiday-card__allowance-wrap">
          <span className="holiday-card__allowance-suffix">days available</span>
        </span>
      </div>
      <p className="holiday-card__sub">
        {overspent
          ? `${formatHolidayDays(Math.abs(available))} days ahead of your accrual`
          : `${formatHolidayDays(accrued)} earned so far · ${used} used`}
      </p>
      <div className="holiday-card__bar-track">
        <div className="holiday-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="holiday-card__sub">
        Total this year: <strong>{formatHolidayDays(proratedAllowance)}</strong> days{isProrated ? ' (prorated)' : ''}
      </p>
      <button
        type="button"
        className="holiday-card__edit-toggle"
        onClick={() => setShowSettings(s => !s)}
        aria-expanded={showSettings}
      >
        {showSettings ? 'Done' : 'Edit'}
      </button>
      {showSettings && (
        <div className="holiday-card__settings">
          <label className="holiday-card__field">
            <span className="holiday-card__field-label">Annual allowance</span>
            <span className="holiday-card__field-control">
              <input
                type="number"
                min="0"
                className="holiday-card__field-input"
                value={allowance}
                onChange={e => onAllowanceChange(e.target.value)}
                aria-label="Annual holiday allowance"
              />
              <span className="holiday-card__field-suffix">days/yr</span>
            </span>
          </label>
          <label className="holiday-card__field">
            <span className="holiday-card__field-label">Started on</span>
            <input
              type="date"
              className="holiday-card__field-input holiday-card__field-input--date"
              value={startDate || ''}
              onChange={e => onStartDateChange(e.target.value)}
              aria-label="Employment start date"
            />
          </label>
          {isProrated && (
            <p className="holiday-card__note">
              Prorated from {formatStartDate(startDate)} ({formatHolidayDays(proratedAllowance)} of {allowance} days)
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function formatStartDate(key) {
  if (!key) return ''
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
