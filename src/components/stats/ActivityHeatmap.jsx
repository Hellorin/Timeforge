const CELL = 10
const GAP = 2
const ROWS = 7
const COLS = 52

export default function ActivityHeatmap({ weeks }) {
  const width = COLS * (CELL + GAP)
  const height = ROWS * (CELL + GAP)

  return (
    <div className="stats-chart">
      <h3 className="stats-chart__title">Activity — last 52 weeks</h3>
      <div className="stats-heatmap__scroll">
        <svg
          className="stats-heatmap"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label="Activity heatmap for the last year"
        >
          {weeks.map((week, wi) =>
            week.days.map((day, di) => (
              <rect
                key={day.key}
                x={wi * (CELL + GAP)}
                y={di * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                ry={2}
                className={`stats-heatmap__cell stats-heatmap__cell--b${day.bucket}`}
              >
                <title>{`${day.key}: ${day.hours}h`}</title>
              </rect>
            ))
          )}
        </svg>
      </div>
      <div className="stats-heatmap__legend">
        <span>Less</span>
        <span className="stats-heatmap__cell-swatch stats-heatmap__cell--b0" />
        <span className="stats-heatmap__cell-swatch stats-heatmap__cell--b1" />
        <span className="stats-heatmap__cell-swatch stats-heatmap__cell--b2" />
        <span className="stats-heatmap__cell-swatch stats-heatmap__cell--b3" />
        <span className="stats-heatmap__cell-swatch stats-heatmap__cell--b4" />
        <span>More</span>
      </div>
    </div>
  )
}
