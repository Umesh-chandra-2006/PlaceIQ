import React, { useState } from 'react';
import axios from '../../api/axios';
import { MapPin, DollarSign, Calendar, Sparkles, CheckCircle, Loader2, Zap, X } from 'lucide-react';

const renderSuggestionChecklist = (suggestion) => {
  if (!suggestion) return null;
  
  const items = suggestion
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .map(s => s.replace(/^[\s-•*]+/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 5);
    
  if (items.length === 0) {
    return <p className="text-sm text-zinc-400 leading-relaxed font-sans">{suggestion}</p>;
  }

  return (
    <ul className="space-y-2.5 mt-2 text-sm text-zinc-400 font-sans">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
          <CheckCircle size={14} className="text-primary-400 mt-1 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const JobCard = ({ job, onOpenDetails, onApplySuccess }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAiReview = async () => {
    setAiReviewing(true);
    try {
      const { data } = await axios.post(`/jobs/${job._id}/ai-review`);
      setAiResult(data);
      setShowAiModal(true);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to perform AI Review");
    } finally {
      setAiReviewing(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await axios.post('/applications', { jobId: job._id });
      setApplied(true);
      if (onApplySuccess) onApplySuccess(job._id);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleApplyClick = () => {
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank');
      setShowConfirmModal(true);
    } else {
      handleApply();
    }
  };

  const handleConfirmApply = async () => {
    setApplying(true);
    setShowConfirmModal(false);
    try {
      await axios.post('/applications', { jobId: job._id });
      setApplied(true);
      if (onApplySuccess) onApplySuccess(job._id);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target.closest('button')) return;
        if (onOpenDetails) onOpenDetails(job);
      }}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors cursor-pointer text-zinc-100"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">{job.title}</h3>
          <p className="text-sm font-medium text-zinc-400">{job.company}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {job.urgencyScore > 20 && (
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
              Urgent
            </span>
          )}
          {job.matchScore !== undefined && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              job.matchScore >= 70 
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/30' 
                : job.matchScore >= 40 
                  ? 'bg-zinc-950 text-zinc-400 border-zinc-800' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {job.matchScore}% Match
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-zinc-500" /> {job.location}</div>
        <div className="flex items-center gap-1.5"><DollarSign size={14} className="text-zinc-500" /> {job.ctc}</div>
        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-zinc-500" /> Deadline: {job.deadline && !isNaN(new Date(job.deadline)) ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-zinc-800/80">
        <div className="text-[10px] font-mono text-zinc-500">
          Posted {job.createdAt && !isNaN(new Date(job.createdAt)) ? new Date(job.createdAt).toLocaleDateString() : 'N/A'} • {job.applicationCount} applicants
        </div>
        
        <div className="flex gap-2 text-sm">
          <button 
            onClick={handleAiReview}
            disabled={aiReviewing}
            className="px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50"
          >
            {aiReviewing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
            AI Review
          </button>
          <button 
            onClick={handleApplyClick}
            disabled={applying || applied}
            className={`px-4 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-2 ${
              applied 
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-default' 
                : 'bg-primary-500 text-zinc-950 hover:bg-primary-400 disabled:opacity-50'
            }`}
          >
            {applying ? <Loader2 className="animate-spin" size={14} /> : applied ? <CheckCircle size={14} /> : null}
            {applied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>

      {/* AI Review Modal */}
      {showAiModal && aiResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-zinc-800 text-zinc-100">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 text-zinc-100"><Zap size={18} className="text-primary-400" /> ATS Review</h2>
                <p className="text-zinc-400 text-xs font-mono mt-1">Powered by OpenRouter AI</p>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-5xl font-bold tracking-tighter text-zinc-100">{aiResult.score}<span className="text-2xl text-zinc-650 font-normal">/100</span></div>
                  <div className="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-semibold">Match Score</div>
                </div>
                <div className={`text-6xl font-bold tracking-tighter ${['A', 'B'].includes(aiResult.grade) ? 'text-primary-400' : ['C'].includes(aiResult.grade) ? 'text-yellow-500' : 'text-red-500'}`}>
                  {aiResult.grade}
                </div>
              </div>

              <div className="space-y-6">
                {aiResult.missingKeywords && aiResult.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs font-mono border border-red-500/20">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {aiResult.matchedKeywords && aiResult.matchedKeywords.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="bg-zinc-950 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono border border-zinc-800">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-6">
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-2 font-mono">AI Suggestion</h4>
                  {renderSuggestionChecklist(aiResult.suggestion)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Apply Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fadeIn text-zinc-100 p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg tracking-tight">Confirm External Application</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Did you complete your application for the <strong>{job.title}</strong> role at <strong>{job.company}</strong> on their portal?
              </p>
            </div>
            
            <div className="flex gap-3 text-sm pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded font-medium transition-colors"
              >
                No, Not Yet
              </button>
              <button 
                onClick={handleConfirmApply}
                disabled={applying}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded flex justify-center items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {applying && <Loader2 className="animate-spin" size={14} />}
                Yes, I Applied
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
