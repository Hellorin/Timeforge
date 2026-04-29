import { useState, useEffect, useCallback } from 'react'
import { formatDateKey, isWeekend } from '../utils/time'

function isoToHHMM(iso) {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function hhmmToISO(dateKey, hhmm) {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  return new Date(y, mo - 1, d, h, min).toISOString()
}

function currentHHMM() {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export default function DayEditModal({ dateKey, sessions, onSave, onClose, dayOffType = null, onSetDayOffType }) {
  const DEFAULT_ROWS = [
    { checkIn: '08:00', checkOut: '12:00' },
    { checkIn: '13:00', checkOut: '17:00' },
  ]

  const isWeekendDay = isWeekend(dateKey)
  const isDayOff = !!dayOffType || isWeekendDay

  const [rows, setRows] = useState(() =>
    sessions.length > 0
      ? sessions.map(s => ({
          checkIn: s.checkIn ? isoToHHMM(s.checkIn) : '',
          checkOut: s.checkOut ? isoToHHMM(s.checkOut) : ''
        }))
      : isDayOff || isWeekendDay ? [] : DEFAULT_ROWS
  )

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function deleteRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  function addSession() {
    setRows(prev => [...prev, { checkIn: currentHHMM(), checkOut: '' }])
  }

  function handleSave() {
    const newSessions = rows
      .filter(r => r.checkIn !== '')
      .map(r => ({
        checkIn: hhmmToISO(dateKey, r.checkIn),
        checkOut: r.checkOut ? hhmmToISO(dateKey, r.checkOut) : null
      }))
    onSave(dateKey, newSessions)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{formatDateKey(dateKey)}</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-day-off-row">
          {isWeekendDay ? (
            <span className="modal-day-off-btn modal-day-off-btn--active modal-day-off-btn--static">Weekend</span>
          ) : (
            <>
              <button
                className={`modal-day-off-btn${dayOffType === 'personal' ? ' modal-day-off-btn--active' : ''}`}
                onClick={() => onSetDayOffType(dayOffType === 'personal' ? null : 'personal')}
                type="button"
                title="Counts against your yearly holiday allowance"
              >
                {dayOffType === 'personal' ? 'Personal ✓' : 'Personal Day Off'}
              </button>
              <button
                className={`modal-day-off-btn modal-day-off-btn--official${dayOffType === 'official' ? ' modal-day-off-btn--active' : ''}`}
                onClick={() => onSetDayOffType(dayOffType === 'official' ? null : 'official')}
                type="button"
                title="Public holiday — does not consume your allowance"
              >
                {dayOffType === 'official' ? 'Official ✓' : 'Official Day Off'}
              </button>
              <button
                className={`modal-day-off-btn modal-day-off-btn--unpaid${dayOffType === 'unpaid' ? ' modal-day-off-btn--active' : ''}`}
                onClick={() => onSetDayOffType(dayOffType === 'unpaid' ? null : 'unpaid')}
                type="button"
                title="Unpaid leave — does not consume your allowance"
              >
                {dayOffType === 'unpaid' ? 'Unpaid ✓' : 'Unpaid Day Off'}
              </button>
            </>
          )}
        </div>

        <div className={`modal-sessions${isDayOff ? ' modal-sessions--dimmed' : ''}`}>
          {rows.length === 0 && (
            <p className="modal-empty">No sessions. Add one below.</p>
          )}
          {rows.map((row, i) => (
            <div key={i} className="modal-session-row">
              <input
                type="time"
                value={row.checkIn}
                onChange={e => updateRow(i, 'checkIn', e.target.value)}
                aria-label="Check-in time"
              />
              <span className="modal-sep">→</span>
              <input
                type="time"
                value={row.checkOut}
                onChange={e => updateRow(i, 'checkOut', e.target.value)}
                aria-label="Check-out time"
                placeholder="open"
              />
              <button className="modal-delete-btn" onClick={() => deleteRow(i)} aria-label="Delete session">×</button>
            </div>
          ))}
        </div>

        <button className="modal-add-btn" onClick={addSession} disabled={isDayOff}>+ Add Session</button>

        <div className="modal-actions">
          <button className="modal-save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
