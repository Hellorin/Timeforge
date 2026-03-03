import { formatTime } from '../utils/time'

export default function ActionButton({ isCheckedIn, onCheckIn, onCheckOut, todaySessions }) {
  const lastSession = todaySessions[todaySessions.length - 1]
  const lastActionTime = lastSession
    ? isCheckedIn
      ? formatTime(lastSession.checkIn)
      : formatTime(lastSession.checkOut)
    : null

  return (
    <div className="action-section">
      <button
        className={`action-btn ${isCheckedIn ? 'checkout' : 'checkin'}`}
        onClick={isCheckedIn ? onCheckOut : onCheckIn}
        aria-label={isCheckedIn ? 'Check out' : 'Check in'}
      >
        {isCheckedIn ? 'Check Out' : 'Check In'}
      </button>
      {lastActionTime && (
        <p className="last-action">
          {isCheckedIn ? 'Checked in at' : 'Checked out at'} <strong>{lastActionTime}</strong>
        </p>
      )}
    </div>
  )
}
