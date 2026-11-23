'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function SessionsChart({ data }: { data: { date: string; sessions: number; learners: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: d.date.slice(5) }))
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#c9a84c" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="learners" name="Learners" stroke="#6ea8fe" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
