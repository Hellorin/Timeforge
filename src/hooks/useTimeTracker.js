import { useState, useCallback } from 'react'
import { getTodayKey, sumSessionsMs, toDecimalHours } from '../utils/time'

const STORAGE_KEY = 'timeforge'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { days: {} }
  } catch {
    return { days: {} }
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useTimeTracker() {
  const [data, setData] = useState(loadData)

  const todayKey = getTodayKey()
  const todaySessions = data.days[todayKey] || []
  const isCheckedIn = todaySessions.length > 0 && todaySessions[todaySessions.length - 1].checkOut === null

  const checkIn = useCallback(() => {
    setData(prev => {
      const next = { ...prev, days: { ...prev.days } }
      const todaySessions = [...(next.days[getTodayKey()] || [])]
      // Prevent double check-in
      if (todaySessions.length > 0 && todaySessions[todaySessions.length - 1].checkOut === null) {
        return prev
      }
      todaySessions.push({ checkIn: new Date().toISOString(), checkOut: null })
      next.days[getTodayKey()] = todaySessions
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
      sessions[lastIdx] = { ...sessions[lastIdx], checkOut: new Date().toISOString() }
      const next = { ...prev, days: { ...prev.days, [key]: sessions } }
      saveData(next)
      return next
    })
  }, [])

  // Build sorted history (newest first), excluding today if today has no sessions
  const allDays = Object.entries(data.days)
    .filter(([, sessions]) => sessions.length > 0)
    .map(([date, sessions]) => {
      const totalMs = sumSessionsMs(sessions)
      return { date, sessions, totalMs, totalDecimal: toDecimalHours(totalMs) }
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

  return {
    isCheckedIn,
    checkIn,
    checkOut,
    todaySessions,
    todayKey,
    allDays,
    setDaySessions
  }
}
