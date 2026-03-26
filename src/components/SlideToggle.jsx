import { formatTime } from '../utils/time'

export default function SlideToggle({ isCheckedIn, onCheckIn, onCheckOut, todaySessions, isTodayOff }) {
  const lastSession = todaySessions[todaySessions.length - 1]
  const lastActionTime = lastSession
    ? isCheckedIn ? formatTime(lastSession.checkIn) : formatTime(lastSession.checkOut)
    : null

  const isDisabled = isTodayOff && !isCheckedIn

  function handleToggle() {
    if (isDisabled) return
    if (isCheckedIn) onCheckOut()
    else onCheckIn()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

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
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="slide-toggle__label slide-toggle__label--resting">🛋️ Resting</span>
        <span className="slide-toggle__knob">
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
