import React from 'react';
import { Users, TrendingUp, DollarSign, Building } from 'lucide-react';

const SummaryStatsRow = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="bg-zinc-950 border border-zinc-900 h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const {
    totalStudents = 0,
    placedStudents = 0,
    placementRate = 0,
    avgCTC = 0,
    highestCTC = 0,
    hasOfferData = false
  } = summary || {};

  const stats = [
    {
      label: 'Placement Rate',
      value: `${placementRate.toFixed(1)}%`,
      subText: `${placedStudents} of ${totalStudents} placed`,
      icon: <TrendingUp size={20} />,
      colorClass: 'text-primary-500 bg-primary-500/10'
    },
    {
      label: 'Total Roster',
      value: totalStudents.toString(),
      subText: 'Active candidates',
      icon: <Users size={20} />,
      colorClass: 'text-zinc-300 bg-zinc-800'
    },
    {
      label: 'Average Package',
      value: hasOfferData ? `${avgCTC.toFixed(1)} LPA` : 'N/A',
      subText: hasOfferData ? 'Across active offers' : 'No offers recorded yet',
      icon: <DollarSign size={20} />,
      colorClass: 'text-indigo-400 bg-indigo-500/10'
    },
    {
      label: 'Highest Package',
      value: hasOfferData ? `${highestCTC.toFixed(1)} LPA` : 'N/A',
      subText: hasOfferData ? 'Peak package secured' : 'No offers recorded yet',
      icon: <Building size={20} />,
      colorClass: 'text-emerald-400 bg-emerald-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{stat.label}</span>
            <h3 className="text-2xl font-bold font-mono text-zinc-100">{stat.value}</h3>
            <span className="text-[10px] text-zinc-550 block font-mono">{stat.subText}</span>
          </div>
          <div className={`p-3 rounded-lg ${stat.colorClass}`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStatsRow;
