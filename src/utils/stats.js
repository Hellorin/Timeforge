import { sumSessionsMs, toDecimalHours, isWeekend } from './time'

const MS_PER_HOUR = 3600000
const MS_PER_DAY = 86400000
const DAY_TARGET_HOURS = 8

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function mondayOf(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const dow = copy.getDay()
  const stepsBack = dow === 0 ? 6 : dow - 1
  copy.setDate(copy.getDate() - stepsBack)
  return copy
}

function addDays(date, n) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + n)
  return copy
}

function isDayOff(dateKey, daysOff) {
  return !!(daysOff[dateKey] || isWeekend(dateKey))
}

/**
 * Entry point: returns a single object with every stat the page needs.
 * All heavy work lives here so it can be memoized by the caller.
 */
export function computeGlobalStats(days, daysOff) {
  const entries = Object.entries(days)
    .filter(([, sessions]) => sessions && sessions.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  const isEmpty = entries.length === 0

  if (isEmpty) {
    return {
      isEmpty: true,
      totals: null,
      averages: null,
      streaks: null,
      charts: null,
    }
  }

  const now = Date.now()

  // Per-day aggregates, excluding days the user has marked off.
  const perDay = entries
    .filter(([key]) => !isDayOff(key, daysOff))
    .map(([key, sessions]) => ({
      key,
      sessions,
      totalMs: sumSessionsMs(sessions, now),
    }))

  const totals = computeTotals(entries, perDay, daysOff)
  const streaks = computeStreaks(perDay, daysOff)
  const averages = computeAverages(perDay, days, daysOff)
  const charts = computeCharts(perDay)

  return { isEmpty: false, totals, averages, streaks, charts }
}

function computeTotals(entries, perDay, daysOff) {
  const totalMs = perDay.reduce((sum, d) => sum + d.totalMs, 0)
  const totalSessions = perDay.reduce((sum, d) => sum + d.sessions.length, 0)
  const workdaysLogged = perDay.length
  const daysOffTaken = Object.keys(daysOff).filter(k => !isWeekend(k)).length
  const firstKey = entries[0][0]
  const firstDate = parseKey(firstKey)
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - firstDate.getTime()) / MS_PER_DAY) + 1)

  return {
    totalHours: toDecimalHours(totalMs),
    totalSessions,
    workdaysLogged,
    daysOffTaken,
    firstTrackedKey: firstKey,
    daysSinceStart,
  }
}

function computeAverages(perDay, days, daysOff) {
  const totalMs = perDay.reduce((sum, d) => sum + d.totalMs, 0)
  const totalSessions = perDay.reduce((sum, d) => sum + d.sessions.length, 0)
  const avgHoursPerWorkday = perDay.length > 0 ? toDecimalHours(totalMs / perDay.length) : 0
  const avgSessionsPerWorkday = perDay.length > 0
    ? Math.round((totalSessions / perDay.length) * 10) / 10
    : 0

  // Average check-in (first session of day) and check-out (last session of day).
  // Uses minutes-from-midnight so crossings of midnight stay well-defined (they don't
  // happen in this single-user app).
  let checkInSum = 0
  let checkOutSum = 0
  let checkInCount = 0
  let checkOutCount = 0
  for (const d of perDay) {
    const first = d.sessions[0]
    const last = d.sessions[d.sessions.length - 1]
    if (first?.checkIn) {
      const dt = new Date(first.checkIn)
      checkInSum += dt.getHours() * 60 + dt.getMinutes()
      checkInCount++
    }
    if (last?.checkOut) {
      const dt = new Date(last.checkOut)
      checkOutSum += dt.getHours() * 60 + dt.getMinutes()
      checkOutCount++
    }
  }
  const typicalCheckIn = checkInCount > 0 ? minutesToHHMM(checkInSum / checkInCount) : null
  const typicalCheckOut = checkOutCount > 0 ? minutesToHHMM(checkOutSum / checkOutCount) : null

  // Average hours per *completed* week (weeks fully in the past, not today's week).
  const currentMonday = mondayOf(new Date())
  const weekTotals = buildWeeklyTotals(days, daysOff)
  const completedWeeks = weekTotals.filter(w => w.mondayDate.getTime() < currentMonday.getTime())
  const completedWeekTotal = completedWeeks.reduce((sum, w) => sum + w.hours, 0)
  const avgHoursPerWeek = completedWeeks.length > 0
    ? Math.round((completedWeekTotal / completedWeeks.length) * 10) / 10
    : 0

  return {
    avgHoursPerWorkday,
    avgHoursPerWeek,
    avgSessionsPerWorkday,
    typicalCheckIn,
    typicalCheckOut,
  }
}

function computeStreaks(perDay, daysOff) {
  const loggedKeys = new Set(perDay.map(d => d.key))

  // Current streak: walk backwards from today through prior workdays.
  // Weekends and days-off are skipped (not breakers).
  let currentStreak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // Allow "today has no session yet" — start the walk from the previous workday.
  if (!loggedKeys.has(toKey(cursor))) {
    cursor = addDays(cursor, -1)
  }
  while (true) {
    const key = toKey(cursor)
    if (isDayOff(key, daysOff)) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (loggedKeys.has(key)) {
      currentStreak++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
    // Safety: don't walk further back than the first logged date.
    if (currentStreak > 10000) break
  }

  // Longest streak: iterate all workdays from the first logged date to today.
  const sortedKeys = perDay.map(d => d.key).sort()
  let longestStreak = 0
  if (sortedKeys.length > 0) {
    let start = parseKey(sortedKeys[0])
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    let run = 0
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const key = toKey(d)
      if (isDayOff(key, daysOff)) continue
      if (loggedKeys.has(key)) {
        run++
        if (run > longestStreak) longestStreak = run
      } else {
        run = 0
      }
    }
  }

  // Longest single session and longest single day.
  let longestSessionMs = 0
  let longestDayMs = 0
  let longestDayKey = null
  for (const d of perDay) {
    if (d.totalMs > longestDayMs) {
      longestDayMs = d.totalMs
      longestDayKey = d.key
    }
    for (const s of d.sessions) {
      if (!s.checkIn || !s.checkOut) continue
      const ms = new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime()
      if (ms > longestSessionMs) longestSessionMs = ms
    }
  }

  // Weeks hit target: count completed weeks whose weekday total met the (prorated-for-daysOff) 40h goal.
  const currentMonday = mondayOf(new Date())
  const weekTotals = buildWeeklyTotals(null, daysOff, perDay)
  const completedWeeks = weekTotals.filter(w => w.mondayDate.getTime() < currentMonday.getTime())
  const weeksHit = completedWeeks.filter(w => w.target > 0 && w.hours >= w.target).length
  const weeksHitPct = completedWeeks.length > 0
    ? Math.round((weeksHit / completedWeeks.length) * 100)
    : 0

  return {
    currentStreak,
    longestStreak,
    longestSessionHours: toDecimalHours(longestSessionMs),
    longestDayHours: toDecimalHours(longestDayMs),
    longestDayKey,
    weeksHit,
    completedWeeks: completedWeeks.length,
    weeksHitPct,
  }
}

function computeCharts(perDay) {
  // Day-of-week totals (Mon–Fri). Index 0 = Monday … 4 = Friday.
  const dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const dowMs = [0, 0, 0, 0, 0]
  const dowCount = [0, 0, 0, 0, 0]
  for (const d of perDay) {
    const date = parseKey(d.key)
    const dow = date.getDay() // 0=Sun..6=Sat
    if (dow === 0 || dow === 6) continue
    const idx = dow - 1
    dowMs[idx] += d.totalMs
    dowCount[idx]++
  }
  const dayOfWeek = dowLabels.map((label, i) => ({
    day: label,
    hours: toDecimalHours(dowMs[i]),
    avgHours: dowCount[i] > 0 ? toDecimalHours(dowMs[i] / dowCount[i]) : 0,
  }))

  // Monthly totals — last 12 months ending with the current month.
  const monthly = buildMonthlyTotals(perDay, 12)

  // Year-over-year — current year vs. previous year, one entry per month.
  const yearOverYear = buildYearOverYear(perDay)

  // Activity heatmap — last 52 weeks × 7 days, anchored to the current week.
  const heatmap = buildHeatmap(perDay)

  return { dayOfWeek, monthly, yearOverYear, heatmap }
}

function buildMonthlyTotals(perDay, months) {
  const now = new Date()
  const bucketMs = new Map()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    bucketMs.set(monthKey(d), 0)
  }
  for (const d of perDay) {
    const date = parseKey(d.key)
    const k = monthKey(date)
    if (bucketMs.has(k)) {
      bucketMs.set(k, bucketMs.get(k) + d.totalMs)
    }
  }
  return Array.from(bucketMs.entries()).map(([key, ms]) => {
    const [y, m] = key.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return {
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      hours: toDecimalHours(ms),
    }
  })
}

function buildYearOverYear(perDay) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const prevYear = currentYear - 1
  const hasPrev = perDay.some(d => parseKey(d.key).getFullYear() === prevYear)
  if (!hasPrev) return null

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const curr = new Array(12).fill(0)
  const prev = new Array(12).fill(0)
  for (const d of perDay) {
    const date = parseKey(d.key)
    const year = date.getFullYear()
    const m = date.getMonth()
    if (year === currentYear) curr[m] += d.totalMs
    else if (year === prevYear) prev[m] += d.totalMs
  }
  return monthNames.map((m, i) => ({
    month: m,
    [String(currentYear)]: toDecimalHours(curr[i]),
    [String(prevYear)]: toDecimalHours(prev[i]),
  }))
}

function buildHeatmap(perDay) {
  const byKey = new Map(perDay.map(d => [d.key, d.totalMs]))
  const thisMonday = mondayOf(new Date())
  const weeks = []
  for (let w = 51; w >= 0; w--) {
    const weekStart = addDays(thisMonday, -7 * w)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i)
      const key = toKey(d)
      const ms = byKey.get(key) ?? 0
      days.push({
        key,
        hours: toDecimalHours(ms),
        bucket: bucketForHours(ms / MS_PER_HOUR),
      })
    }
    weeks.push({ weekStart: toKey(weekStart), days })
  }
  return weeks
}

function bucketForHours(h) {
  if (h <= 0) return 0
  if (h < 2) return 1
  if (h < 4) return 2
  if (h < 6) return 3
  return 4
}

function buildWeeklyTotals(daysMap, daysOff, perDay = null) {
  // Build { mondayDate, mondayKey, hours, target } for every week spanned by data.
  const source = perDay
    ? perDay
    : Object.entries(daysMap || {})
        .filter(([key, sessions]) => sessions && sessions.length > 0 && !isDayOff(key, daysOff))
        .map(([key, sessions]) => ({ key, sessions, totalMs: sumSessionsMs(sessions) }))

  if (source.length === 0) return []

  const keys = source.map(d => d.key).sort()
  const firstMonday = mondayOf(parseKey(keys[0]))
  const lastMonday = mondayOf(parseKey(keys[keys.length - 1]))

  const byKey = new Map(source.map(d => [d.key, d.totalMs]))
  const weeks = []
  for (let m = new Date(firstMonday); m <= lastMonday; m = addDays(m, 7)) {
    let ms = 0
    let offCount = 0
    for (let i = 0; i < 5; i++) {
      const d = addDays(m, i)
      const key = toKey(d)
      if (daysOff[key]) offCount++
      else ms += byKey.get(key) ?? 0
    }
    weeks.push({
      mondayDate: new Date(m),
      mondayKey: toKey(m),
      hours: toDecimalHours(ms),
      target: (5 - offCount) * DAY_TARGET_HOURS,
    })
  }
  return weeks
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function minutesToHHMM(minutes) {
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
