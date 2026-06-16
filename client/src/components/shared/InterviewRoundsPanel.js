import React from 'react';
import { Plus } from 'lucide-react';

const InterviewRoundsPanel = ({
  rounds = [],
  isStudent = true,
  applicationId,
  selectedAppForRound,
  setSelectedAppForRound,
  newRound,
  setNewRound,
  onAddRoundSubmit,
  onRoundStatusUpdate
}) => {
  if (isStudent) {
    return (
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-400 font-mono block">Scheduled Interview Rounds:</span>
        {rounds.length > 0 ? (
          <div className="space-y-2.5">
            {rounds.map((round) => (
              <div key={round._id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-start text-xs font-mono animate-fadeIn">
                <div>
                  <div className="font-semibold text-zinc-200">Round {round.roundNumber}: {round.roundType}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Date: {round.scheduledAt ? new Date(round.scheduledAt).toLocaleString() : 'N/A'}
                  </div>
                  {round.feedback && (
                    <div className="text-zinc-400 mt-2 bg-zinc-950 p-2 rounded border border-zinc-850 font-sans">
                      {round.feedback}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  round.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500' :
                  round.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                  'bg-zinc-800 text-zinc-400'
                }`}>{round.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-550 italic font-mono">No interview rounds scheduled yet.</p>
        )}
      </div>
    );
  }

  // Coordinator View
  return (
    <div className="border-t border-zinc-850/50 pt-3 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-500">
        <span>Interview Rounds Tracking</span>
        <button 
          onClick={() => setSelectedAppForRound(selectedAppForRound === applicationId ? null : applicationId)}
          className="text-primary-500 hover:text-primary-400 flex items-center gap-1 font-semibold"
        >
          <Plus size={12} /> Schedule Round
        </button>
      </div>

      {/* Round scheduling form */}
      {selectedAppForRound === applicationId && (
        <form onSubmit={(e) => onAddRoundSubmit(e, applicationId)} className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="block mb-1 text-zinc-500">Round Type</label>
              <select 
                value={newRound.roundType}
                onChange={e => setNewRound({ ...newRound, roundType: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-200"
              >
                <option value="Technical">Technical</option>
                <option value="Managerial">Managerial</option>
                <option value="HR">HR</option>
                <option value="GD">GD</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-zinc-500">Scheduled Date</label>
              <input 
                type="datetime-local" 
                required
                value={newRound.scheduledAt}
                onChange={e => setNewRound({...newRound, scheduledAt: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-200"
              />
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Add notes (e.g. Google Meet Link)"
            value={newRound.notes}
            onChange={e => setNewRound({...newRound, notes: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-zinc-200 focus:outline-none"
          />
          <div className="flex justify-end gap-2 text-[10px] pt-1">
            <button type="button" onClick={() => setSelectedAppForRound(null)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300">Cancel</button>
            <button type="submit" className="px-2 py-1 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded">Schedule</button>
          </div>
        </form>
      )}

      {rounds.length > 0 ? (
        <div className="space-y-2">
          {rounds.map(round => (
            <div key={round._id} className="bg-zinc-955 p-2.5 rounded border border-zinc-855 flex justify-between items-start text-[11px] animate-fadeIn">
              <div>
                <span className="font-semibold text-zinc-300">Round {round.roundNumber}: {round.roundType}</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Date: {round.scheduledAt ? new Date(round.scheduledAt).toLocaleString() : 'N/A'}</span>
                {round.notes && <span className="text-zinc-550 text-[9px] block mt-0.5">Notes: {round.notes}</span>}
                {round.feedback && <div className="text-zinc-400 mt-1.5 p-1 bg-zinc-900 rounded font-sans text-xs">{round.feedback}</div>}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  round.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500' :
                  round.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                  'bg-zinc-800 text-zinc-400'
                }`}>{round.status}</span>
                {round.status === 'scheduled' && (
                  <div className="flex gap-1 text-[9px] font-bold uppercase tracking-wider mt-1">
                    <button 
                      onClick={() => onRoundStatusUpdate(applicationId, round._id, 'passed')}
                      className="text-emerald-500 hover:underline"
                    >
                      Pass
                    </button>
                    <span className="text-zinc-755">|</span>
                    <button 
                      onClick={() => onRoundStatusUpdate(applicationId, round._id, 'failed')}
                      className="text-red-500 hover:underline"
                    >
                      Fail
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">No scheduled interview rounds yet.</p>
      )}
    </div>
  );
};

export default InterviewRoundsPanel;
