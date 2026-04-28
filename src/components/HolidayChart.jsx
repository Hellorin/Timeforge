import { useMemo } from 'react'
import { computeAccruedDays, formatHolidayDays } from '../utils/holidays'

const MONTH_LABELS = ['J','F','M','A','M','J','J','A','S','O','N','D']

const W = 300
const H = 110
const PAD = { t: 10, r: 8, b: 22, l: 26 }
const CW = W - PAD.l - PAD.r
const CH = H - PAD.t - PAD.b

export default function HolidayChart({ daysOff, allowance, startDate }) {
  const today = new Date()
  const year = today.getFullYear()
  const currentM = today.getMonth()

  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthEnd = new Date(year, i + 1, 0)
      const monthEndKey = `${year}-${String(i + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`
      const earned = computeAccruedDays(startDate, allowance, monthEnd)
      const used = Object.entries(daysOff).reduce((n, [k, v]) => {
        if (v !== 'personal' || !k.startsWith(`${year}-`)) return n
        return k <= monthEndKey ? n + 1 : n
      }, 0)
      return { month: i, earned, used }
    })
  }, [daysOff, startDate, allowance, year])

  const maxY = Math.max(...data.map(d => Math.max(d.earned, d.used)), 1)

  const xAt = i => PAD.l + (i / 11) * CW
  const yAt = v => PAD.t + CH * (1 - v / maxY)

  // Split at current month so past = solid, future = dashed (shared point at currentM)
  const earnedPast = data.slice(0, currentM + 1).map(d => `${xAt(d.month)},${yAt(d.earned)}`).join(' ')
  const earnedFuture = data.slice(currentM).map(d => `${xAt(d.month)},${yAt(d.earned)}`).join(' ')
  const usedPast = data.slice(0, currentM + 1).map(d => `${xAt(d.month)},${yAt(d.used)}`).join(' ')
  const usedFuture = data.slice(currentM).map(d => `${xAt(d.month)},${yAt(d.used)}`).join(' ')

  const yTicks = [0, maxY / 2, maxY]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="holiday-chart" aria-hidden="true">
      {/* Horizontal grid lines + Y labels */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yAt(v)} x2={W - PAD.r} y2={yAt(v)} className="holiday-chart__grid" />
          <text x={PAD.l - 3} y={yAt(v)} textAnchor="end" dominantBaseline="middle" className="holiday-chart__axis-label">
            {formatHolidayDays(v)}
          </text>
        </g>
      ))}

      {/* Earned line */}
      <polyline points={earnedPast} className="holiday-chart__earned" />
      <polyline points={earnedFuture} className="holiday-chart__earned holiday-chart__earned--future" />

      {/* Used/planned line */}
      <polyline points={usedPast} className="holiday-chart__used-line" />
      <polyline points={usedFuture} className="holiday-chart__used-line holiday-chart__used-line--future" />

      {/* Today vertical marker */}
      <line x1={xAt(currentM)} y1={PAD.t} x2={xAt(currentM)} y2={H - PAD.b} className="holiday-chart__today-line" />

      {/* Month labels */}
      {MONTH_LABELS.map((label, i) => (
        <text
          key={i}
          x={xAt(i)}
          y={H - 5}
          textAnchor="middle"
          className={`holiday-chart__month-label${i === currentM ? ' holiday-chart__month-label--current' : ''}`}
        >
          {label}
        </text>
      ))}

      {/* Legend */}
      <circle cx={W - PAD.r - 80} cy={PAD.t + 2} r={2.5} className="holiday-chart__legend-earned" />
      <text x={W - PAD.r - 75} y={PAD.t + 4} className="holiday-chart__axis-label">Earned</text>
      <circle cx={W - PAD.r - 38} cy={PAD.t + 2} r={2.5} className="holiday-chart__legend-used" />
      <text x={W - PAD.r - 33} y={PAD.t + 4} className="holiday-chart__axis-label">Used</text>
    </svg>
  )
}
