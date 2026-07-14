import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CGPADistributionChart = ({ cgpaData, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-80 flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading CGPA distribution...</span>
      </div>
    );
  }

  const buckets = cgpaData?.buckets || [];

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">CGPA vs Placement status</span>
        <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Placed vs unplaced roster counts across CGPA brackets</p>
      </div>

      {buckets.length === 0 || buckets.every(b => b.placed === 0 && b.unplaced === 0) ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-650 font-mono italic">
          No student GPA distribution data available.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={buckets} 
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="range" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
              <YAxis stroke="#71717a" fontSize={10} fontClassName="font-mono" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                cursor={{ fill: '#27272a', opacity: 0.1 }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Bar dataKey="placed" stackId="a" fill="#10b981" name="Placed Students" radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="unplaced" stackId="a" fill="#3f3f46" name="Unplaced Students" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CGPADistributionChart;
