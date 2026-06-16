import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import InterviewRoundsPanel from './InterviewRoundsPanel';
import OfferVerifyPanel from './OfferVerifyPanel';

const ApplicantsTab = ({
  applications = [],
  loadingApps = false,
  handleUpdateStage,
  selectedAppForRound,
  setSelectedAppForRound,
  newRound,
  setNewRound,
  handleAddRoundSubmit,
  handleRoundStatusUpdate,
  handleVerifyOffer,
  getFileUrl
}) => {
  const [localStages, setLocalStages] = useState({});
  const [localNotes, setLocalNotes] = useState({});
  const [loadingAppId, setLoadingAppId] = useState(null);

  if (loadingApps) {
    return (
      <div className="text-center py-12 text-zinc-500 text-xs font-mono">
        Loading candidates roster...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-555 text-xs font-mono border border-zinc-850 rounded bg-zinc-900/10">
        0 applications submitted for this job yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map(app => (
        <div key={app._id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-4 animate-fadeIn">
          {/* Student Card Info */}
          <div className="flex justify-between items-start text-xs font-mono">
            <div>
              <div className="font-semibold text-zinc-200 text-sm font-sans">{app.studentId?.name}</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">{app.studentId?.email}</div>
              <div className="text-zinc-400 text-[10px] mt-1 uppercase tracking-wider">
                {app.studentId?.branch} • CGPA: {app.studentId?.cgpa}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                {app.matchScore}% Match
              </span>
            </div>
          </div>

          {/* Move Stage Section with Notes Input & Update Button */}
          <div className="border-t border-zinc-800/60 pt-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Move Stage:</span>
              <select 
                value={localStages[app._id] !== undefined ? localStages[app._id] : app.stage}
                onChange={(e) => setLocalStages({ ...localStages, [app._id]: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-300 font-semibold px-2 py-1.5 focus:outline-none"
              >
                <option value="applied">Applied</option>
                <option value="oa">OA (Test)</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <input 
                type="text"
                placeholder="Stage note (e.g. Cleared resume match)"
                value={localNotes[app._id] !== undefined ? localNotes[app._id] : (app.notes || '')}
                onChange={(e) => setLocalNotes({ ...localNotes, [app._id]: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-300 px-3 py-1.5 focus:outline-none flex-1 min-w-[200px]"
              />
            </div>
            
            <button
              onClick={async () => {
                const targetStage = localStages[app._id] !== undefined ? localStages[app._id] : app.stage;
                const notes = localNotes[app._id] !== undefined ? localNotes[app._id] : (app.notes || '');
                setLoadingAppId(app._id);
                await handleUpdateStage(app._id, targetStage, notes);
                setLoadingAppId(null);
              }}
              disabled={loadingAppId === app._id}
              className="bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 ml-auto md:ml-0"
            >
              {loadingAppId === app._id && <Loader2 size={12} className="animate-spin" />}
              Update Stage
            </button>
          </div>

          {/* Display Interview rounds under candidate if in interview stage */}
          {app.stage === "interview" && (
            <InterviewRoundsPanel
              rounds={app.interviewRounds}
              isStudent={false}
              applicationId={app._id}
              selectedAppForRound={selectedAppForRound}
              setSelectedAppForRound={setSelectedAppForRound}
              newRound={newRound}
              setNewRound={setNewRound}
              onAddRoundSubmit={handleAddRoundSubmit}
              onRoundStatusUpdate={handleRoundStatusUpdate}
            />
          )}

          {/* Display Offer verification actions under candidate if offer letter exists */}
          {app.offerDetails?.offerLetterUrl && (
            <OfferVerifyPanel
              application={app}
              isStudent={false}
              onVerifyOffer={handleVerifyOffer}
              getFileUrl={getFileUrl}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ApplicantsTab;
export { ApplicantsTab };
