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

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function computeProratedAllowance(startDateKey, annualAllowance, year = new Date().getFullYear()) {
  const allowance = Number(annualAllowance) || 0
  const start = parseDateKey(startDateKey)
  if (!start) return allowance

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)

  if (start <= yearStart) return allowance
  if (start > yearEnd) return 0

  const daysInYear = isLeapYear(year) ? 366 : 365
  const msPerDay = 1000 * 60 * 60 * 24
  const daysRemaining = Math.round((yearEnd - start) / msPerDay) + 1

  return (allowance * daysRemaining) / daysInYear
}

export function formatHolidayDays(n) {
  if (!Number.isFinite(n)) return '0'
  const floored = Math.floor(n * 10) / 10
  if (Number.isInteger(floored)) return String(floored)
  return floored.toFixed(1)
}
