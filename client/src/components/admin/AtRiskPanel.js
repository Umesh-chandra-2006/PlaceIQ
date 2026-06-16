import React from 'react';
import { Sparkles } from 'lucide-react';

const AtRiskPanel = ({ atRiskStudents = [], loading = false }) => {
  return (
    <div className="border border-zinc-800 rounded bg-zinc-900/10 p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono text-[11px]">
          <Sparkles size={16} className="text-amber-500" /> At-Risk Student Warnings
        </h3>
      </div>
      {loading ? (
        <div className="text-center py-4 text-zinc-550 text-xs font-mono">Loading data...</div>
      ) : atRiskStudents.length === 0 ? (
        <div className="text-center py-4 text-zinc-550 text-xs font-mono">No students flag status currently active. All profiles are in good standing.</div>
      ) : (
        <div className="space-y-2">
          {atRiskStudents.map((student) => (
            <div key={student._id} className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded border border-zinc-850">
              <div>
                <div className="font-semibold text-zinc-200 text-xs">{student.name}</div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{student.rollNumber || student.email}</div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[10px] font-mono font-bold">
                  {student.cgpa < 6.0 ? `Low CGPA: ${student.cgpa}` : `Backlogs: ${student.activeBacklogs}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtRiskPanel;
