import { useCallback, useState } from 'react'

const STORAGE_KEY = 'timeforgeSettings'
const DEFAULTS = {
  annualHolidayAllowance: 25,
  employmentStartDate: null,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function useAppSettings() {
  const [settings, setSettings] = useState(loadSettings)

  const setAnnualHolidayAllowance = useCallback((value) => {
    const n = Math.max(0, Math.floor(Number(value) || 0))
    setSettings(prev => {
      const next = { ...prev, annualHolidayAllowance: n }
      saveSettings(next)
      return next
    })
  }, [])

  const setEmploymentStartDate = useCallback((value) => {
    const v = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
    setSettings(prev => {
      const next = { ...prev, employmentStartDate: v }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, setAnnualHolidayAllowance, setEmploymentStartDate }
}
