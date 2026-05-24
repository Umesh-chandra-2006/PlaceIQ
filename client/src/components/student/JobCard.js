/**
 * Individual Job Card for the student feed.
 */
import React, { useState } from 'react';
import axios from '../../api/axios';
import { MapPin, DollarSign, Calendar, Sparkles, CheckCircle, Loader2, Zap, X } from 'lucide-react';

const JobCard = ({ job }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

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
    } catch (error) {
      alert(error.response?.data?.error || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
            <p className="text-primary-600 font-medium">{job.company}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {job.urgencyScore > 20 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Urgent
              </span>
            )}
            {job.matchScore !== undefined && (
              <span className={`text-xs font-bold px-2 py-1 rounded border ${job.matchScore >= 70 ? 'bg-green-50 text-green-700 border-green-200' : job.matchScore >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {job.matchScore}% Match
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
          <div className="flex items-center gap-1"><MapPin size={16} /> {job.location}</div>
          <div className="flex items-center gap-1"><DollarSign size={16} /> {job.ctc}</div>
          <div className="flex items-center gap-1"><Calendar size={16} /> Deadline: {new Date(job.deadline).toLocaleDateString()}</div>
        </div>

        {job.aiSummary && job.aiSummary.length > 0 && (
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-primary-700 font-bold text-xs uppercase mb-2">
              <Sparkles size={14} /> AI Summary
            </div>
            <ul className="space-y-1">
              {job.aiSummary.map((bullet, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-primary-400 mt-1">•</span> {bullet}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400 flex-1">
            Posted {new Date(job.createdAt).toLocaleDateString()} • {job.applicationCount} applicants
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleAiReview}
              disabled={aiReviewing}
              className="px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
            >
              {aiReviewing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              AI Review
            </button>
            <button 
              onClick={handleApply}
            disabled={applying || applied}
            className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
              applied 
                ? 'bg-green-100 text-green-700 cursor-default' 
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
            }`}
          >
            {applying ? <Loader2 className="animate-spin" size={18} /> : applied ? <CheckCircle size={18} /> : null}
            {applied ? 'Applied' : 'Apply Now'}
          </button>
          </div>
        </div>
      </div>
      
      {/* AI Review Modal */}
      {showAiModal && aiResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-indigo-600 to-primary-600 p-6 text-white relative">
              <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-200"><X size={24} /></button>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><Zap size={24} /> ATS Review</h2>
              <p className="text-indigo-100 text-sm">Powered by OpenRouter AI</p>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-4xl font-black text-gray-800">{aiResult.score}<span className="text-xl text-gray-400">/100</span></div>
                  <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Match Score</div>
                </div>
                <div className={`text-5xl font-black ${['A', 'B'].includes(aiResult.grade) ? 'text-green-500' : ['C'].includes(aiResult.grade) ? 'text-yellow-500' : 'text-red-500'}`}>
                  {aiResult.grade}
                </div>
              </div>

              <div className="space-y-4">
                {aiResult.missingKeywords && aiResult.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs border border-red-100">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {aiResult.matchedKeywords && aiResult.matchedKeywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs border border-green-100">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4">
                  <h4 className="text-sm font-bold text-indigo-900 mb-1">AI Suggestion</h4>
                  <p className="text-sm text-indigo-700">{aiResult.suggestion}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowAiModal(false)} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
