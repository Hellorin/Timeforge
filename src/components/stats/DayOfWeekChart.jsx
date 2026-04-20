import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DayOfWeekChart({ data }) {
  return (
    <div className="stats-chart">
      <h3 className="stats-chart__title">Average hours by day</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: 'rgba(128,128,128,0.08)' }}
            contentStyle={{
              background: 'var(--surface-alt)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text)' }}
            itemStyle={{ color: 'var(--text)' }}
            formatter={(v) => [`${v}h`, 'Avg']}
          />
          <Bar dataKey="avgHours" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.day} fill="var(--accent-in)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
