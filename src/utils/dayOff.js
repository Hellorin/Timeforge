/**
 * Day-off type helpers. A day-off marker is a string: a base type
 * ('personal' | 'official' | 'unpaid') optionally suffixed with '-half' to
 * mark a half day off (the other half is expected to be worked normally).
 */

export const DAY_OFF_TYPES = ['personal', 'personal-half', 'official', 'unpaid', 'unpaid-half']

export function isValidDayOffType(type) {
  return DAY_OFF_TYPES.includes(type)
}

export function isHalfDayOff(type) {
  return type === 'personal-half' || type === 'unpaid-half'
}

// Fraction of the day taken off by the given marker (0 when unset).
export function dayOffFraction(type) {
  if (!type) return 0
  return isHalfDayOff(type) ? 0.5 : 1
}

// Strips the '-half' suffix, e.g. 'personal-half' -> 'personal'.
export function dayOffBaseType(type) {
  return isHalfDayOff(type) ? type.slice(0, -'-half'.length) : type
}
