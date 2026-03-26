import { useState, useCallback, useRef } from 'react'
import { getTodayKey, sumSessionsMs, toDecimalHours, isWeekend, getWeekDays, computeWeekProgress } from '../utils/time'

const STORAGE_KEY = 'timeforge'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : { days: {}, daysOff: {} }
    if (!parsed.daysOff) parsed.daysOff = {}
    return parsed
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
      return { date, sessions, totalMs, totalDecimal: toDecimalHours(totalMs), isOff }
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

  const toggleDayOff = useCallback((dateKey) => {
    setData(prev => {
      const daysOff = { ...prev.daysOff }
      if (daysOff[dateKey]) {
        delete daysOff[dateKey]
      } else {
        daysOff[dateKey] = true
      }
      const next = { ...prev, daysOff }
      saveData(next)
      return next
    })
  }, [])

  const isTodayOff = !!(data.daysOff[todayKey] || isWeekend(todayKey))

  const setMilestoneCallback = useCallback((fn) => { milestoneCallbackRef.current = fn }, [])

  return {
    isCheckedIn,
    checkIn,
    checkOut,
    todaySessions,
    todayKey,
    allDays,
    setDaySessions,
    daysOff: data.daysOff,
    toggleDayOff,
    isTodayOff,
    setMilestoneCallback
  }
}
