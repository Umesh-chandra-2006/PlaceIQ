import React from 'react';

const TopCompaniesList = ({ companiesData, loading }) => {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-950 p-4 h-80 flex items-center justify-center shadow-lg">
        <span className="text-xs font-mono text-zinc-650">Loading top companies...</span>
      </div>
    );
  }

  const list = companiesData?.companies || [];

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 flex flex-col shadow-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-850">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Top Recruiting Partners</span>
        <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Top recruiters ranked by offers generated</p>
      </div>

      <div className="flex-1 overflow-auto">
        {list.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-650 font-mono italic">
            No recruiting data found.
          </div>
        ) : (
          <table className="min-w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-zinc-950 border-b border-zinc-850 text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              <tr>
                <th className="px-4 py-2.5 font-medium">Partner Company</th>
                <th className="px-4 py-2.5 font-medium text-right">Offers</th>
                <th className="px-4 py-2.5 font-medium text-right">Avg Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 font-mono">
              {list.map((c, i) => (
                <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-200">{c.company}</td>
                  <td className="px-4 py-3 text-right text-primary-500 font-bold">{c.offersCount}</td>
                  <td className="px-4 py-3 text-right text-zinc-350">{c.avgCTC > 0 ? `${c.avgCTC.toFixed(1)} LPA` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TopCompaniesList;
