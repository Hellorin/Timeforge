import { useState, useCallback, useMemo, useRef } from 'react'
import { getTodayKey, sumSessionsMs, toDecimalHours, isWeekend, getWeekDays, computeWeekProgress } from '../utils/time'
import { computeGlobalStats } from '../utils/stats'

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const STORAGE_KEY = 'timeforge'
const AUTO_CHECKOUT_HOUR = 21

// Auto close any open session whose check-in was on a past calendar day —
// we assume the user forgot to check out. Cap the checkout at 21:00 of the
// check-in day (or the check-in time itself if it was already later).
function autoCloseStaleSessions(data) {
  const todayKey = getTodayKey()
  let nextDays = null

  for (const dateKey of Object.keys(data.days)) {
    if (dateKey >= todayKey) continue
    const sessions = data.days[dateKey]
    const last = sessions[sessions.length - 1]
    if (!last || last.checkOut !== null) continue

    const [y, m, d] = dateKey.split('-').map(Number)
    const cutoff = new Date(y, m - 1, d, AUTO_CHECKOUT_HOUR, 0, 0, 0).getTime()
    const checkInMs = new Date(last.checkIn).getTime()
    const checkOutMs = Math.max(checkInMs, cutoff)

    if (!nextDays) nextDays = { ...data.days }
    const updated = sessions.slice()
    updated[updated.length - 1] = {
      ...last,
      checkOut: new Date(checkOutMs).toISOString(),
      autoCheckedOut: true,
    }
    nextDays[dateKey] = updated
  }

  return nextDays ? { ...data, days: nextDays } : data
}

// Convert legacy `daysOff[key] = true` entries to the typed form
// `daysOff[key] = "personal"`. Existing days off are conservatively assumed
// to have consumed the user's holiday allowance.
function migrateDaysOff(data) {
  let changed = false
  const next = {}
  for (const [k, v] of Object.entries(data.daysOff)) {
    if (v === true) {
      next[k] = 'personal'
      changed = true
    } else if (v === 'personal' || v === 'official' || v === 'unpaid') {
      next[k] = v
    }
  }
  return changed ? { ...data, daysOff: next } : data
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : { days: {}, daysOff: {} }
    if (!parsed.daysOff) parsed.daysOff = {}
    const migrated = migrateDaysOff(parsed)
    const fixed = autoCloseStaleSessions(migrated)
    if (fixed !== parsed) saveData(fixed)
    return fixed
  } catch {
    return { days: {}, daysOff: {} }
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useTimeTracker() {
  const [data, setData] = useState(loadData)
  const milestoneCallbackRef = useRef(null)

  const todayKey = getTodayKey()
  const todaySessions = data.days[todayKey] || []
  const isCheckedIn = todaySessions.length > 0 && todaySessions[todaySessions.length - 1].checkOut === null

  const checkIn = useCallback(() => {
    setData(prev => {
      const key = getTodayKey()
      // Prevent check-in on days off (including weekends)
      if (prev.daysOff[key] || isWeekend(key)) return prev
      const next = { ...prev, days: { ...prev.days } }
      const todaySessions = [...(next.days[key] || [])]
      // Prevent double check-in
      if (todaySessions.length > 0 && todaySessions[todaySessions.length - 1].checkOut === null) {
        return prev
      }
      todaySessions.push({ checkIn: new Date().toISOString(), checkOut: null })
      next.days[key] = todaySessions
      saveData(next)
      return next
    })
  }, [])

  const checkOut = useCallback(() => {
    setData(prev => {
      const key = getTodayKey()
      const sessions = [...(prev.days[key] || [])]
      const lastIdx = sessions.length - 1
      if (lastIdx < 0 || sessions[lastIdx].checkOut !== null) return prev

      const now = Date.now()

      // BEFORE: only previously closed sessions (excludes the current open session)
      const closedSessions = sessions.slice(0, lastIdx)
      const dailyBefore = toDecimalHours(sumSessionsMs(closedSessions))
      const weekDays = getWeekDays()
      const beforeDays = { ...prev.days, [key]: closedSessions }
      const { weekTotal: weekBefore, weekTarget } = computeWeekProgress(weekDays, beforeDays, prev.daysOff)

      // Apply mutation
      sessions[lastIdx] = { ...sessions[lastIdx], checkOut: new Date(now).toISOString() }
      const next = { ...prev, days: { ...prev.days, [key]: sessions } }
      saveData(next)

      // AFTER: all sessions closed including the one just closed
      const dailyAfter = toDecimalHours(sumSessionsMs(sessions))
      const { weekTotal: weekAfter } = computeWeekProgress(weekDays, next.days, next.daysOff)

      // Detect milestone crossing
      const crossedDaily = dailyBefore < 8 && dailyAfter >= 8
      const crossedWeekly = weekTarget > 0 && weekBefore < weekTarget && weekAfter >= weekTarget
      const milestone = crossedWeekly ? 'weekly' : crossedDaily ? 'daily' : null
      if (milestone) milestoneCallbackRef.current?.(milestone)

      return next
    })
  }, [])

  // Build sorted history (newest first), excluding today if today has no sessions
  const allDays = Object.entries(data.days)
    .filter(([, sessions]) => sessions.length > 0)
    .map(([date, sessions]) => {
      const isOff = !!(data.daysOff[date] || isWeekend(date))
      const totalMs = isOff ? 0 : sumSessionsMs(sessions)
      const autoCheckedOut = sessions.some(s => s.autoCheckedOut)
      return { date, sessions, totalMs, totalDecimal: toDecimalHours(totalMs), isOff, autoCheckedOut }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const setDaySessions = useCallback((dateKey, sessions) => {
    setData(prev => {
      const next = { ...prev, days: { ...prev.days } }
      if (sessions.length === 0) {
        delete next.days[dateKey]
      } else {
        next.days[dateKey] = sessions
      }
      saveData(next)
      return next
    })
  }, [])

  // type: 'personal' | 'official' | 'unpaid' | null (null clears the day-off marker)
  const setDayOffType = useCallback((dateKey, type) => {
    setData(prev => {
      const daysOff = { ...prev.daysOff }
      if (type === null) {
        delete daysOff[dateKey]
      } else if (type === 'personal' || type === 'official' || type === 'unpaid') {
        daysOff[dateKey] = type
      } else {
        return prev
      }
      const next = { ...prev, daysOff }
      saveData(next)
      return next
    })
  }, [])

  // Bulk variant: applies the same day-off type (or clears) to many dates at once.
  // Weekends are skipped — they're implicitly off and can't carry a personal/official marker.
  const setDaysOffTypeBulk = useCallback((dateKeys, type) => {
    if (!Array.isArray(dateKeys) || dateKeys.length === 0) return
    if (type !== null && type !== 'personal' && type !== 'official' && type !== 'unpaid') return
    setData(prev => {
      const daysOff = { ...prev.daysOff }
      for (const dateKey of dateKeys) {
        if (isWeekend(dateKey)) continue
        if (type === null) {
          delete daysOff[dateKey]
        } else {
          daysOff[dateKey] = type
        }
      }
      const next = { ...prev, daysOff }
      saveData(next)
      return next
    })
  }, [])

  const isTodayOff = !!(data.daysOff[todayKey] || isWeekend(todayKey))

  const stats = useMemo(() => computeGlobalStats(data.days, data.daysOff), [data.days, data.daysOff])

  const personalDaysUsedThisYear = useMemo(() => {
    const prefix = `${new Date().getFullYear()}-`
    const todayKey = getTodayKey()
    let n = 0
    for (const [k, v] of Object.entries(data.daysOff)) {
      if (v === 'personal' && k.startsWith(prefix) && k <= todayKey) n++
    }
    return n
  }, [data.daysOff])

  const setMilestoneCallback = useCallback((fn) => { milestoneCallbackRef.current = fn }, [])

  // Week progress — all in raw ms for minute-level precision (live today added in TodaySummary)
  const weekDays = getWeekDays()
  const weekdays = weekDays.slice(0, 5)
  const daysOffCount = weekdays.filter(d => data.daysOff[toKey(d)]).length
  const weekTargetMs = (5 - daysOffCount) * 8 * 3600000
  const weekTotalOtherDaysMs = weekDays.reduce((sum, date) => {
    const key = toKey(date)
    if (key === todayKey || data.daysOff[key] || isWeekend(key)) return sum
    const sessions = data.days[key] || []
    return sum + sumSessionsMs(sessions)
  }, 0)

  return {
    isCheckedIn,
    checkIn,
    checkOut,
    todaySessions,
    todayKey,
    allDays,
    setDaySessions,
    daysOff: data.daysOff,
    setDayOffType,
    setDaysOffTypeBulk,
    isTodayOff,
    personalDaysUsedThisYear,
    setMilestoneCallback,
    weekTargetMs,
    weekTotalOtherDaysMs,
    stats,
  }
}
