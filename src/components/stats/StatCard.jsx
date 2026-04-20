export default function StatCard({ label, value, unit, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">
        {value}
        {unit && <span className="stat-card__unit">{unit}</span>}
      </div>
      <div className="stat-card__label">{label}</div>
      {hint && <div className="stat-card__hint">{hint}</div>}
    </div>
  )
}
