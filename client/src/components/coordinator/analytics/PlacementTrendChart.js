import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PlacementTrendChart = ({ trendData, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-[320px] flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading chronological trends...</span>
      </div>
    );
  }

  const points = trendData?.points || [];
  const granularity = trendData?.granularity || 'week';

  // If sparse data, hide completely
  if (points.length < 3) return null;

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Season progress timeline</span>
        <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Chronological summary grouped by {granularity}s</p>
      </div>

      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="period" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
            <YAxis stroke="#71717a" fontSize={10} fontClassName="font-mono" allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
            <Area type="monotone" dataKey="applications" stroke="#71717a" fill="none" strokeWidth={1.5} name="Applications" />
            <Area type="monotone" dataKey="offers" stroke="#818cf8" fill="url(#colorOffers)" strokeWidth={2} name="Offers Made" />
            <Area type="monotone" dataKey="placements" stroke="#10b981" fill="url(#colorPlacements)" strokeWidth={2} name="Secured Placements" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PlacementTrendChart;
