import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import JobDetailsDrawer from '../shared/JobDetailsDrawer';
import { Loader2, ChevronRight, Clock, MapPin, DollarSign } from 'lucide-react';

const stages = [
  { id: 'applied', label: 'Applied', color: 'bg-zinc-500' },
  { id: 'oa', label: 'Assessment', color: 'bg-blue-500' },
  { id: 'interview', label: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500' }
];

const Tracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchApps = async () => {
    try {
      const { data } = await axios.get('/applications?limit=1000');
      setApplications(data && data.data ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Error fetching applications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-650" size={24} /></div>;

  return (
    <div className="max-w-6xl mx-auto text-zinc-100">
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Application Tracker</h1>
        <p className="text-zinc-400 text-sm mt-1">Track your active applications across stages.</p>
      </div>

      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-6 snap-x" id="application-stages-board">
        {stages.map(stage => (
          <div key={stage.id} className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-4 min-w-[290px] w-[290px] shrink-0 snap-start flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-1 pb-2 border-b border-zinc-800/40">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                {stage.label}
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-500">
                {applications.filter(a => a.stage === stage.id).length}
              </span>
            </div>
            
            <div className="space-y-3 overflow-y-auto flex-1 max-h-[420px] pr-1">
              {applications.filter(a => a.stage === stage.id).map(app => (
                <div 
                  key={app._id} 
                  onClick={() => app.jobId && setSelectedJob(app.jobId)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 p-4 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden flex flex-col gap-2 hover:-translate-y-0.5"
                >
                  {/* Top Row: Title + Match Score */}
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-zinc-200 text-sm tracking-tight truncate group-hover:text-zinc-100 transition-colors flex-1" title={app.jobId?.title}>
                      {app.jobId?.title || 'Unknown Role'}
                    </h4>
                    {app.matchScore > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">
                        {app.matchScore}% Match
                      </span>
                    )}
                  </div>

                  {/* Company */}
                  <p className="text-zinc-450 text-xs font-medium truncate -mt-1">{app.jobId?.company || 'Unknown Company'}</p>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {app.jobId?.location && app.jobId.location !== 'N/A' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-850 text-[10px] text-zinc-400 max-w-[120px] truncate" title={app.jobId.location}>
                        <MapPin size={10} className="text-zinc-500" />
                        <span className="truncate">{app.jobId.location.split(',')[0]}</span>
                      </span>
                    )}
                    {app.jobId?.stipend && app.jobId.stipend !== 'N/A' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-850 text-[10px] text-zinc-400 font-mono">
                        <DollarSign size={10} className="text-zinc-500" />
                        {app.jobId.stipend}
                      </span>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-550 mt-2 pt-2 border-t border-zinc-850/60">
                    <span className="flex items-center gap-1"><Clock size={11} /> {app.updatedAt && !isNaN(new Date(app.updatedAt)) ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors text-xs font-semibold flex items-center gap-0.5">Details <ChevronRight size={12} /></span>
                  </div>
                </div>
              ))}
              {applications.filter(a => a.stage === stage.id).length === 0 && (
                <div className="border border-dashed border-zinc-800/40 bg-zinc-900/5 rounded-lg py-8 flex flex-col items-center justify-center text-center">
                  <p className="text-zinc-650 text-xs font-mono">Empty Column</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <JobDetailsDrawer 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          theme="student"
          onApplySuccess={() => {
            fetchApps();
          }}
        />
      )}
    </div>
  );
};

export default Tracker;
