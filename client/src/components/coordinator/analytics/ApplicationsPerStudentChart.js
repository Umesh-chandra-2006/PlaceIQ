import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ApplicationsPerStudentChart = ({ distData, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-80 flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading student application rates...</span>
      </div>
    );
  }

  const buckets = distData?.buckets || [];

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Applications Per Student</span>
        <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Distribution counts (red indicates zero applications/high-risk)</p>
      </div>

      {buckets.length === 0 || buckets.every(b => b.count === 0) ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-650 font-mono italic">
          No student application counts recorded.
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={35} name="Student Count">
                {buckets.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.range === '0 applications' ? '#ef4444' : '#6366f1'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPerStudentChart;
