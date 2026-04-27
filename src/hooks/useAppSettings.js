import { useCallback, useState } from 'react'

const STORAGE_KEY = 'timeforgeSettings'
const DEFAULTS = {
  annualHolidayAllowance: 25,
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

  return { settings, setAnnualHolidayAllowance }
}
