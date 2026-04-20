import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function YearOverYearChart({ data, currentYear, prevYear }) {
  return (
    <div className="stats-chart">
      <h3 className="stats-chart__title">Year over year</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: 'rgba(128,128,128,0.08)' }}
            contentStyle={{
              background: 'var(--surface-alt)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(v) => `${v}h`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
            iconType="circle"
          />
          <Bar dataKey={String(prevYear)} fill="var(--text-muted)" radius={[3, 3, 0, 0]} />
          <Bar dataKey={String(currentYear)} fill="var(--accent-in)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
