import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DepartmentBreakdownChart = ({ departmentsData, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-80 flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading department stats...</span>
      </div>
    );
  }

  const list = departmentsData?.departments || [];

  const getBarColor = (rate) => {
    if (rate < 30) return '#ef4444'; // Red
    if (rate < 50) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Department Placement Breakdown</span>
        <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Departments sorted by success rate (red under 30%, green above 50%)</p>
      </div>

      {list.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-650 font-mono italic">
          No department data available.
        </div>
      ) : (
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart 
              data={list} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={10} fontClassName="font-mono" domain={[0, 100]} />
              <YAxis 
                type="category" 
                dataKey="department" 
                stroke="#71717a" 
                fontSize={10} 
                fontClassName="font-mono" 
                width={70}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                cursor={{ fill: '#27272a', opacity: 0.15 }}
                formatter={(value, name) => [`${value}%`, 'Placement Rate']}
              />
              <Bar 
                dataKey="placementRate" 
                radius={[0, 4, 4, 0]} 
                maxBarSize={22}
                label={{ 
                  position: 'right', 
                  fill: '#a1a1aa', 
                  fontSize: 10, 
                  fontFamily: 'monospace',
                  formatter: (value) => `${value}%` 
                }}
              >
                {list.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.placementRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DepartmentBreakdownChart;
