import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Pulled out into its own file (and lazy-loaded from MockTestApp.jsx) so that
// recharts — a fairly heavy charting library — only gets downloaded once a
// candidate actually reaches the Results screen, instead of being part of the
// initial bundle every visitor pays for on first load.
export default function ResultsChart({ chartData, verdictColor }) {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} label={{ value: 'sec', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--ink-soft)' }} />
          <Tooltip
            formatter={(v) => [`${v}s`, 'time spent']}
            labelFormatter={(l) => `Q${l}`}
            // Recharts' default tooltip box is a hardcoded white background —
            // without this it stays white in dark mode too. Theming it here
            // keeps it in step with --surface/--rule/--ink like everything else.
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 4 }}
            labelStyle={{ color: 'var(--ink)' }}
            itemStyle={{ color: 'var(--ink-soft)' }}
          />
          <Bar dataKey="seconds" radius={[2, 2, 0, 0]}>
            {chartData.map((d, i) => <Cell key={i} fill={verdictColor[d.verdict] || 'var(--brass)'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}