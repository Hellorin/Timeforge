import { sumSessionsMs, toDecimalHours, isWeekend } from './time'

const MS_PER_HOUR = 3600000
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

  const totals = computeTotals(perDay)
  const streaks = computeStreaks(perDay, daysOff)
  const averages = computeAverages(perDay)
  const charts = computeCharts(perDay)

  return { isEmpty: false, totals, averages, streaks, charts }
}

function computeTotals(perDay) {
  const totalMs = perDay.reduce((sum, d) => sum + d.totalMs, 0)
  return {
    totalHours: toDecimalHours(totalMs),
    workdaysLogged: perDay.length,
  }
}

function computeAverages(perDay) {
  const totalMs = perDay.reduce((sum, d) => sum + d.totalMs, 0)
  const avgHoursPerWorkday = perDay.length > 0 ? toDecimalHours(totalMs / perDay.length) : 0
  return { avgHoursPerWorkday }
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

  // Weeks hit target: count completed weeks whose weekday total met the (prorated-for-daysOff) 40h goal.
  const currentMonday = mondayOf(new Date())
  const weekTotals = buildWeeklyTotals(perDay, daysOff)
  const completedWeeks = weekTotals.filter(w => w.mondayDate.getTime() < currentMonday.getTime())
  const weeksHit = completedWeeks.filter(w => w.target > 0 && w.hours >= w.target).length
  const weeksHitPct = completedWeeks.length > 0
    ? Math.round((weeksHit / completedWeeks.length) * 100)
    : 0

  return {
    currentStreak,
    weeksHit,
    completedWeeks: completedWeeks.length,
    weeksHitPct,
  }
}

function computeCharts(perDay) {
  // Monthly totals — last 12 months ending with the current month.
  const monthly = buildMonthlyTotals(perDay, 12)

  // Activity heatmap — last 52 weeks × 7 days, anchored to the current week.
  const heatmap = buildHeatmap(perDay)

  return { monthly, heatmap }
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

export function buildWeeklyTotals(perDay, daysOff) {
  if (perDay.length === 0) return []

  const keys = perDay.map(d => d.key).sort()
  const firstMonday = mondayOf(parseKey(keys[0]))
  const lastMonday = mondayOf(parseKey(keys[keys.length - 1]))

  const byKey = new Map(perDay.map(d => [d.key, d.totalMs]))
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

/**
 * Returns health-relevant weekly stats for the HealthPage.
 * Uses the last `weeksBack` completed weeks for the average; falls back to
 * all-time daily average × 5 when not enough history exists.
 */
export function computeRecentWeeklyAvg(days, daysOff, weeksBack = 4) {
  const now = Date.now()
  const entries = Object.entries(days)
    .filter(([, sessions]) => sessions && sessions.length > 0)

  if (entries.length === 0) {
    return { recentAvgHours: 0, recentAvgTarget: 0, weekCount: 0, currentWeekHours: 0, currentWeekTarget: 0, status: 'empty' }
  }

  const perDay = entries
    .filter(([key]) => !isDayOff(key, daysOff))
    .map(([key, sessions]) => ({ key, sessions, totalMs: sumSessionsMs(sessions, now) }))

  const currentMonday = mondayOf(new Date())
  const allWeeks = buildWeeklyTotals(perDay, daysOff)

  // Current week
  const currentWeekData = allWeeks.find(w => w.mondayKey === toKey(currentMonday))
  const currentWeekHours = currentWeekData?.hours ?? 0
  const currentWeekTarget = currentWeekData?.target ?? DAY_TARGET_HOURS * 5

  // Last N completed weeks
  const completedWeeks = allWeeks.filter(w => w.mondayDate.getTime() < currentMonday.getTime())
  const recent = completedWeeks.slice(-weeksBack)

  let recentAvgHours
  let recentAvgTarget
  let weekCount
  if (recent.length > 0) {
    recentAvgHours = recent.reduce((sum, w) => sum + w.hours, 0) / recent.length
    // Average the prorated targets so days-off weeks don't distort the comparison
    recentAvgTarget = recent.reduce((sum, w) => sum + w.target, 0) / recent.length
    weekCount = recent.length
  } else {
    // Fallback: extrapolate from daily average against standard 5-day target
    const totalMs = perDay.reduce((sum, d) => sum + d.totalMs, 0)
    const avgDay = perDay.length > 0 ? toDecimalHours(totalMs / perDay.length) : 0
    recentAvgHours = avgDay * 5
    recentAvgTarget = DAY_TARGET_HOURS * 5
    weekCount = 0
  }

  // Thresholds relative to the (prorated) target:
  //   ok        = 100–112.5% of target  (≈ 40–45 h on a standard week)
  //   too-much  = above 112.5%
  //   not-enough = below 100%
  const UPPER_RATIO = 45 / 40 // 1.125
  let status
  if (recentAvgTarget === 0) status = 'not-enough'
  else if (recentAvgHours > recentAvgTarget * UPPER_RATIO) status = 'too-much'
  else if (recentAvgHours >= recentAvgTarget) status = 'ok'
  else status = 'not-enough'

  return { recentAvgHours, recentAvgTarget, weekCount, currentWeekHours, currentWeekTarget, status }
}
