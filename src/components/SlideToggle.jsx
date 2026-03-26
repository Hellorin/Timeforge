import { useRef, useState } from 'react'
import { formatTime } from '../utils/time'

// Knob left positions (px) matching the CSS rules
const KNOB_REST = 4
const KNOB_WORK = 140  // calc(50%) of 280px track
const MIDPOINT  = (KNOB_REST + KNOB_WORK) / 2  // 72px — past here = "working"

export default function SlideToggle({ isCheckedIn, onCheckIn, onCheckOut, todaySessions, isTodayOff }) {
  const lastSession = todaySessions[todaySessions.length - 1]
  const lastActionTime = lastSession
    ? isCheckedIn ? formatTime(lastSession.checkIn) : formatTime(lastSession.checkOut)
    : null

  const isDisabled = isTodayOff && !isCheckedIn

  // Drag state stored in a ref to avoid re-render overhead during move
  const drag = useRef({ startX: 0, startLeft: 0, moved: false, currentLeft: 0, wasDrag: false })
  // knobLeft drives an inline style override during drag; null = CSS class controls position
  const [knobLeft, setKnobLeft] = useState(null)

  function toggle() {
    if (isDisabled) return
    if (isCheckedIn) onCheckOut()
    else onCheckIn()
  }

  function handleClick() {
    // Suppress the synthetic click that follows a touch drag
    if (drag.current.wasDrag) {
      drag.current.wasDrag = false
      return
    }
    toggle()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  function handleTouchStart(e) {
    if (isDisabled) return
    const t = e.touches[0]
    drag.current.startX    = t.clientX
    drag.current.startLeft = isCheckedIn ? KNOB_WORK : KNOB_REST
    drag.current.moved     = false
    drag.current.currentLeft = drag.current.startLeft
  }

  function handleTouchMove(e) {
    if (isDisabled) return
    const delta  = e.touches[0].clientX - drag.current.startX
    const newLeft = Math.max(KNOB_REST, Math.min(KNOB_WORK, drag.current.startLeft + delta))

    if (Math.abs(delta) > 4) drag.current.moved = true
    drag.current.currentLeft = newLeft
    setKnobLeft(newLeft)
  }

  function handleTouchEnd() {
    if (!drag.current.moved) {
      // Tiny movement — treat as a tap; let the click handler fire normally
      setKnobLeft(null)
      return
    }

    const shouldBeWorking = drag.current.currentLeft > MIDPOINT
    drag.current.wasDrag = true
    drag.current.moved   = false
    setKnobLeft(null)

    if (shouldBeWorking !== isCheckedIn) toggle()
  }

  const knobStyle = knobLeft !== null ? { left: `${knobLeft}px`, transition: 'none' } : undefined

  return (
    <div className="action-section">
      <div
        className={[
          'slide-toggle',
          isCheckedIn ? 'slide-toggle--working' : 'slide-toggle--resting',
          isDisabled ? 'slide-toggle--disabled' : ''
        ].join(' ')}
        role="switch"
        aria-checked={isCheckedIn}
        aria-disabled={isDisabled}
        aria-label={isCheckedIn ? 'Working — click to check out' : 'Resting — click to check in'}
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="slide-toggle__label slide-toggle__label--resting">🛋️ Resting</span>
        <span className="slide-toggle__knob" style={knobStyle}>
          <span className="slide-toggle__emoji" aria-hidden="true">
            {isCheckedIn ? '🏃' : '🛋️'}
          </span>
        </span>
        <span className="slide-toggle__label slide-toggle__label--working">Working 🏃</span>
      </div>
      {lastActionTime && (
        <p className="last-action">
          {isCheckedIn ? 'Checked in at' : 'Checked out at'} <strong>{lastActionTime}</strong>
        </p>
      )}
    </div>
  )
}
