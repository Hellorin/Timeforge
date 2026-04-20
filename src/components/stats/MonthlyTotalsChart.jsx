import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { decimalToHoursMinutes } from '../../utils/time'

export default function MonthlyTotalsChart({ data }) {
  return (
    <div className="stats-chart">
      <h3 className="stats-chart__title">Last 12 months</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
            width={52}
            tickFormatter={decimalToHoursMinutes}
          />
          <Tooltip
            cursor={{ fill: 'rgba(128,128,128,0.08)' }}
            contentStyle={{
              background: 'var(--surface-alt)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
            formatter={(v) => [decimalToHoursMinutes(v), 'Total']}
          />
          <Bar dataKey="hours" fill="var(--accent-in)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
