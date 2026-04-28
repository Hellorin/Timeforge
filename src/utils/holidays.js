function parseDateKey(str) {
  if (typeof str !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date
}

export function computeAccruedDays(startDateKey, annualAllowance, today = new Date()) {
  const allowance = Number(annualAllowance) || 0
  const monthlyRate = allowance / 12
  const year = today.getFullYear()

  const yearStart = new Date(year, 0, 1)
  const start = parseDateKey(startDateKey)
  const earnFrom = (start && start > yearStart) ? start : yearStart

  if (earnFrom > today) return 0

  // Credit is given at the end of each complete month.
  // Only months whose last day has already passed are counted.
  let completedMonths = 0
  let y = earnFrom.getFullYear()
  let m = earnFrom.getMonth()

  while (y <= year) {
    const monthEnd = new Date(y, m + 1, 0)
    if (monthEnd > today) break
    completedMonths++
    m++
    if (m > 11) { m = 0; y++ }
  }

  return monthlyRate * completedMonths
}

export function computeProratedAllowance(startDateKey, annualAllowance, year = new Date().getFullYear()) {
  const allowance = Number(annualAllowance) || 0
  const start = parseDateKey(startDateKey)
  if (!start) return allowance

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)

  if (start <= yearStart) return allowance
  if (start > yearEnd) return 0

  const startMonth = start.getMonth()
  const startDay = start.getDate()
  const daysInStartMonth = new Date(year, startMonth + 1, 0).getDate()
  const partialStartMonth = (daysInStartMonth - startDay + 1) / daysInStartMonth
  const fullMonthsRemaining = 11 - startMonth
  const monthsRemaining = partialStartMonth + fullMonthsRemaining

  return (allowance * monthsRemaining) / 12
}

export function formatHolidayDays(n) {
  if (!Number.isFinite(n)) return '0'
  const floored = Math.floor(n * 10) / 10
  if (Number.isInteger(floored)) return String(floored)
  return floored.toFixed(1)
}
