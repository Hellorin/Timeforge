import { describe, it, expect } from 'vitest'
import { buildDaysOffIcs } from './icsExport'

describe('buildDaysOffIcs', () => {
  it('includes only entries for the requested month', () => {
    const daysOff = {
      '2024-03-15': 'personal',
      '2024-04-01': 'sick',
    }
    const ics = buildDaysOffIcs(daysOff, 2024, 2) // March (0-indexed)
    expect(ics).toContain('DTSTART;VALUE=DATE:20240315')
    expect(ics).not.toContain('20240401')
  })

  it('labels half-day entries distinctly', () => {
    const ics = buildDaysOffIcs({ '2024-03-15': 'personal-half' }, 2024, 2)
    expect(ics).toContain('Day Off (Personal\\, Half Day)')
  })

  it('skips unknown day-off types', () => {
    const ics = buildDaysOffIcs({ '2024-03-15': 'not-a-real-type' }, 2024, 2)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('rolls DTEND over to the next day, handling month-end overflow', () => {
    const ics = buildDaysOffIcs({ '2024-03-31': 'official' }, 2024, 2)
    expect(ics).toContain('DTEND;VALUE=DATE:20240401')
  })

  it('wraps content in VCALENDAR with CRLF line endings', () => {
    const ics = buildDaysOffIcs({}, 2024, 2)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})
