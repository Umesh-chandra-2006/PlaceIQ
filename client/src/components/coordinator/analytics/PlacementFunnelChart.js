import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PlacementFunnelChart = ({ funnel, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-80 flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading pipeline funnel...</span>
      </div>
    );
  }

  const stages = funnel?.stages || [];

  // Calculate funnel conversions
  const chartData = stages.map((item, index) => {
    let conversion = 100;
    if (index > 0 && stages[index - 1].count > 0) {
      conversion = Math.round((item.count / stages[index - 1].count) * 100);
    }
    return {
      stage: item.stage,
      Students: item.count,
      'Conv %': conversion
    };
  });

  const renderCustomBarLabel = (props) => {
    const { x = 0, y = 0, width = 0, height = 0, value, index, payload } = props;
    if (value === undefined || value === null) return null;
    
    let text = `${value}`;
    let stageIndex = typeof index === 'number' ? index : chartData.findIndex(d => d.stage === payload?.stage);
    if (stageIndex > 0 && chartData[stageIndex]) {
      text = `${value} (${chartData[stageIndex]['Conv %']}% conv)`;
    }

    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        fill="#a1a1aa"
        fontSize={10}
        fontFamily="monospace"
        dominantBaseline="middle"
      >
        {text}
      </text>
    );
  };

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Recruitment Pipeline Funnel</span>
          <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Cumulative reach of students across hiring stages</p>
        </div>
      </div>
      
      {stages.length === 0 || stages.every(s => s.count === 0) ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-650 font-mono italic">
          No pipeline funnel metrics found for this selection.
        </div>
      ) : (
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
              <YAxis 
                type="category" 
                dataKey="stage" 
                stroke="#71717a" 
                fontSize={10} 
                fontClassName="font-mono" 
                width={80}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                cursor={{ fill: '#27272a', opacity: 0.15 }}
                formatter={(value, name) => [value, name]}
              />
              <Bar 
                dataKey="Students" 
                fill="#10b981" 
                radius={[0, 4, 4, 0]} 
                maxBarSize={28}
                label={renderCustomBarLabel}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PlacementFunnelChart;
