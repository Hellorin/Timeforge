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

  const fromY = earnFrom.getFullYear()
  const fromM = earnFrom.getMonth()
  const fromD = earnFrom.getDate()
  const toY = today.getFullYear()
  const toM = today.getMonth()
  const toD = today.getDate()

  let months = 0

  if (fromY === toY && fromM === toM) {
    const daysInMonth = new Date(toY, toM + 1, 0).getDate()
    months = (toD - fromD + 1) / daysInMonth
  } else {
    const daysInFromMonth = new Date(fromY, fromM + 1, 0).getDate()
    months += (daysInFromMonth - fromD + 1) / daysInFromMonth
    let m = fromM + 1
    let y = fromY
    while (y < toY || (y === toY && m < toM)) {
      months += 1
      m++
      if (m > 11) { m = 0; y++ }
    }
    const daysInToMonth = new Date(toY, toM + 1, 0).getDate()
    months += toD / daysInToMonth
  }

  return monthlyRate * months
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
