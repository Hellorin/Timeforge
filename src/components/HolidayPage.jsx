import { useMemo, useState } from 'react'
import { getTodayKey } from '../utils/time'
import { computeProratedAllowance, computeAccruedDays, formatHolidayDays } from '../utils/holidays'
import HolidayChart from './HolidayChart'

export default function HolidayPage({ used, daysOff, allowance, onAllowanceChange, startDate, onStartDateChange }) {
  return (
    <section className="holiday-page">
      <HolidayBalanceCard
        used={used}
        daysOff={daysOff}
        allowance={allowance}
        onAllowanceChange={onAllowanceChange}
        startDate={startDate}
        onStartDateChange={onStartDateChange}
      />
    </section>
  )
}

function HolidayBalanceCard({ used, daysOff, allowance, onAllowanceChange, startDate, onStartDateChange }) {
  const [showSettings, setShowSettings] = useState(false)
  const today = new Date()
  const year = today.getFullYear()
  const todayKey = getTodayKey()

  const proratedAllowance = computeProratedAllowance(startDate, allowance, year)
  const accrued = computeAccruedDays(startDate, allowance, today)
  const isProrated = startDate && proratedAllowance !== allowance
  const available = accrued - used
  const overspent = available < 0
  const pct = accrued > 0 ? Math.min(100, (used / accrued) * 100) : 0

  const futurePlannedKeys = useMemo(() =>
    Object.entries(daysOff)
      .filter(([k, v]) => v === 'personal' && k > todayKey && k.startsWith(`${year}-`))
      .map(([k]) => k)
  , [daysOff, todayKey, year])

  const planned = futurePlannedKeys.length
  const projected = used + planned
  const yearEndSurplus = proratedAllowance - projected

  let badgeClass, badgeText
  if (yearEndSurplus < 0) {
    badgeClass = 'over'
    badgeText = `⚠ ${formatHolidayDays(Math.abs(yearEndSurplus))} days over by year end`
  } else {
    badgeClass = 'ok'
    badgeText = `✓ ${formatHolidayDays(yearEndSurplus)} days to spare`
  }

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
      <div className="holiday-card__projection">
        <div className="holiday-card__projection-header">
          <span className="holiday-card__projection-label">Year-end projection</span>
          <span className={`holiday-card__projection-badge holiday-card__projection-badge--${badgeClass}`}>
            {badgeText}
          </span>
        </div>
        <p className="holiday-card__sub">
          {used} used + {planned} planned = {projected} of {formatHolidayDays(proratedAllowance)} days
        </p>
      </div>
      <HolidayChart daysOff={daysOff} allowance={allowance} startDate={startDate} />
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
