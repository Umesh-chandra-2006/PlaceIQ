import React, { useState, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, Loader2, Zap, CheckCircle } from 'lucide-react';
import axios from '../../api/axios';
import { getFileUrl } from '../../utils/fileUtil';
import JobOverviewTab from './JobOverviewTab';
import ApplicantsTab from './ApplicantsTab';
import InterviewRoundsPanel from './InterviewRoundsPanel';
import OfferVerifyPanel from './OfferVerifyPanel';
import AtsScorePanel from './AtsScorePanel';

const JobDetailsDrawer = ({ job, onClose, theme = "student", onApplySuccess }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [studentApplication, setStudentApplication] = useState(null);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiResult, setShowAiResult] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Coordinator specific states
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "candidates"
  const [selectedAppForRound, setSelectedAppForRound] = useState(null);
  const [newRound, setNewRound] = useState({ roundType: 'Technical', scheduledAt: '', notes: '' });

  // Student specific offer upload states
  const [offerFile, setOfferFile] = useState(null);
  const [ctcInput, setCtcInput] = useState('');
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const offerFileInputRef = useRef(null);

  const isStudent = theme === "student";

  // Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Check application status for student or load candidate roster for coordinator
  useEffect(() => {
    if (!job) return;

    if (isStudent) {
      const checkApplied = async () => {
        try {
          const { data } = await axios.get('/applications?limit=1000');
          const appsList = data && data.data ? data.data : (Array.isArray(data) ? data : []);
          const userApp = appsList.find(app => app.jobId?._id === job._id || app.jobId === job._id);
          if (userApp) {
            setApplied(true);
            setStudentApplication(userApp);
          } else {
            setApplied(false);
            setStudentApplication(null);
          }
        } catch (error) {
          console.error("Error checking application status", error);
        }
      };
      checkApplied();
    } else {
      fetchCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, theme]);

  const fetchCandidates = async () => {
    setLoadingApps(true);
    try {
      const { data } = await axios.get(`/applications?jobId=${job._id}&limit=1000`);
      setApplications(data && data.data ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Error fetching applicants", error);
    } finally {
      setLoadingApps(false);
    }
  };

  if (!job) return null;

  const handleApply = async () => {
    setApplying(true);
    try {
      await axios.post('/applications', { jobId: job._id });
      setApplied(true);
      // Reload applications to populate details
      const { data } = await axios.get('/applications?limit=1000');
      const appsList = data && data.data ? data.data : (Array.isArray(data) ? data : []);
      const userApp = appsList.find(app => app.jobId?._id === job._id || app.jobId === job._id);
      if (userApp) setStudentApplication(userApp);
      
      if (onApplySuccess) onApplySuccess(job._id);
      alert("Applied successfully!");
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
      onClose(); // close details drawer since job is now applied and filtered out
    } catch (error) {
      alert(error.response?.data?.error || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const handleAiReview = async () => {
    setAiReviewing(true);
    try {
      const { data } = await axios.post(`/jobs/${job._id}/ai-review`);
      setAiResult(data);
      setShowAiResult(true);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to perform AI Review");
    } finally {
      setAiReviewing(false);
    }
  };

  // Coordinator Actions
  const handleUpdateStage = async (appId, newStage, notes) => {
    try {
      const { data } = await axios.put(`/applications/${appId}`, { stage: newStage, notes });
      setApplications(applications.map(a => a._id === appId ? { ...a, stage: data.stage, notes: data.notes } : a));
    } catch (e) {
      alert("Failed to update candidate stage");
    }
  };

  const handleAddRoundSubmit = async (e, appId) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/applications/${appId}/rounds`, newRound);
      setApplications(applications.map(a => a._id === appId ? data : a));
      setSelectedAppForRound(null);
      setNewRound({ roundType: 'Technical', scheduledAt: '', notes: '' });
      alert("Round scheduled!");
    } catch (e) {
      alert("Failed to schedule interview round");
    }
  };

  const handleRoundStatusUpdate = async (appId, roundId, status) => {
    const feedback = prompt("Enter outcome notes/feedback (optional):") || "";
    try {
      const { data } = await axios.put(`/applications/${appId}/rounds/${roundId}`, { status, feedback });
      setApplications(applications.map(a => a._id === appId ? data : a));
    } catch (e) {
      alert("Failed to update round status");
    }
  };

  const handleVerifyOffer = async (appId, status) => {
    const reviewNotes = prompt(`Enter review notes for this ${status === 'verified' ? 'verification' : 'rejection'}:`) || "";
    try {
      const { data } = await axios.put(`/applications/${appId}/offer-verify`, { status, reviewNotes });
      setApplications(applications.map(a => a._id === appId ? data : a));
      alert(`Offer status updated to: ${status.toUpperCase()}`);
    } catch (e) {
      alert(e.response?.data?.error || "Action failed");
    }
  };

  // Student Actions
  const handleOfferUploadSubmit = async (e) => {
    e.preventDefault();
    if (!offerFile) return;
    setUploadingOffer(true);
    const formData = new FormData();
    formData.append('offerLetter', offerFile);
    formData.append('ctc', ctcInput);
    try {
      const { data } = await axios.put(`/applications/${studentApplication._id}/offer-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStudentApplication(data);
      setOfferFile(null);
      setCtcInput('');
      alert('Offer letter uploaded successfully! Coordinators have been notified for review.');
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingOffer(false);
    }
  };

  // Style configurations
  const styles = {
    student: {
      drawerBg: "bg-zinc-950 text-zinc-100 border-l border-zinc-800 font-sans",
      overlayBg: "bg-black/60 backdrop-blur-xs",
      headerBorder: "border-b border-zinc-800",
      closeBtn: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
      metaText: "text-zinc-400 font-mono",
      actionBtnSecondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
    },
    coordinator: {
      drawerBg: "bg-zinc-955 text-zinc-100 border-l border-zinc-800 font-sans",
      overlayBg: "bg-black/60 backdrop-blur-xs",
      headerBorder: "border-b border-zinc-800",
      closeBtn: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
      metaText: "text-zinc-400 font-mono",
      actionBtnSecondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
    }
  }[theme];

  return (
    <FocusTrap active={true} focusTrapOptions={{ clickOutsideDeactivates: true }}>
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        {/* Backdrop */}
        <div className={`absolute inset-0 transition-opacity ${styles.overlayBg}`} onClick={onClose} />

        {/* Drawer Panel */}
        <div className={`relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 animate-slideOver ${styles.drawerBg}`}>
        {/* Header */}
        <div className={`p-6 flex flex-col gap-4 ${styles.headerBorder}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 id="drawer-title" className="text-xl font-bold tracking-tight truncate">{job.title}</h2>
              <p className="text-sm font-medium text-primary-500 mt-1">{job.company}</p>
              {isStudent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1 mt-2">
                  <CheckCircle size={12} /> Eligible to Apply
                </span>
              )}
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-md transition-colors ${styles.closeBtn}`}>
              <X size={18} />
            </button>
          </div>

          {/* Coordinator Tab Toggles */}
          {!isStudent && (
            <div className="flex border-b border-zinc-800 gap-4 text-sm font-medium">
              <button 
                onClick={() => setActiveTab("info")} 
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-500 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
              >
                Job Info
              </button>
              <button 
                onClick={() => setActiveTab("candidates")} 
                className={`pb-2 border-b-2 transition-colors relative flex items-center gap-1.5 ${activeTab === 'candidates' ? 'border-primary-500 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
              >
                Applicants
                <span className="bg-zinc-900 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {applications.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 select-text">
          {isStudent || activeTab === "info" ? (
            <>
              <JobOverviewTab job={job} theme={theme} />

              {/* Student Interview Progress & Offer Upload Workspace */}
              {isStudent && studentApplication && (
                <div className="space-y-6 pt-6 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold tracking-wider font-mono text-zinc-300 uppercase">Your Application Tracking</h3>
                  
                  <InterviewRoundsPanel
                    rounds={studentApplication.interviewRounds}
                    isStudent={true}
                    applicationId={studentApplication._id}
                  />

                  <OfferVerifyPanel
                    application={studentApplication}
                    isStudent={true}
                    onOfferUploadSubmit={handleOfferUploadSubmit}
                    offerFile={offerFile}
                    setOfferFile={setOfferFile}
                    ctcInput={ctcInput}
                    setCtcInput={setCtcInput}
                    uploadingOffer={uploadingOffer}
                    offerFileInputRef={offerFileInputRef}
                    getFileUrl={getFileUrl}
                  />
                </div>
              )}
            </>
          ) : (
            /* Coordinator Candidates Tab Workspace */
            <ApplicantsTab
              applications={applications}
              loadingApps={loadingApps}
              handleUpdateStage={handleUpdateStage}
              selectedAppForRound={selectedAppForRound}
              setSelectedAppForRound={setSelectedAppForRound}
              newRound={newRound}
              setNewRound={setNewRound}
              handleAddRoundSubmit={handleAddRoundSubmit}
              handleRoundStatusUpdate={handleRoundStatusUpdate}
              handleVerifyOffer={handleVerifyOffer}
              getFileUrl={getFileUrl}
            />
          )}
        </div>

        {/* Footer actions */}
        {isStudent && (
          <div className={`p-6 border-t flex items-center justify-between gap-3 ${styles.headerBorder}`}>
            <button 
              onClick={handleAiReview}
              disabled={aiReviewing}
              className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors flex-1 justify-center ${styles.actionBtnSecondary} disabled:opacity-50`}
            >
              {aiReviewing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
              AI ATS Review
            </button>
            <button 
              onClick={handleApplyClick}
              disabled={applying || applied}
              className={`px-6 py-2 rounded-md font-semibold text-sm flex-1 justify-center flex items-center gap-2 transition-colors ${
                applied 
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-805 cursor-default' 
                  : 'bg-primary-500 text-zinc-950 hover:bg-primary-400 disabled:opacity-50'
              }`}
            >
              {applying ? <Loader2 className="animate-spin" size={14} /> : applied ? <CheckCircle size={14} /> : null}
              {applied ? 'Applied' : 'Apply Now'}
            </button>
          </div>
        )}

        {!isStudent && activeTab === "info" && (
          <div className={`p-6 border-t text-[11px] font-mono flex justify-between items-center ${styles.headerBorder} ${styles.metaText}`}>
            <div>Posted: {job.createdAt && !isNaN(new Date(job.createdAt)) ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div>{job.applicationCount || 0} applicants</div>
          </div>
        )}
      </div>

      {/* Embedded AI Review Modal */}
      {showAiResult && aiResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-zinc-800 text-zinc-100">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 text-zinc-100"><Zap size={18} className="text-primary-400" /> ATS Review</h2>
                <p className="text-zinc-400 text-xs font-mono mt-1">Powered by OpenRouter AI</p>
              </div>
              <button onClick={() => setShowAiResult(false)} className="text-zinc-550 hover:text-zinc-300 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <AtsScorePanel aiResult={aiResult} />
            </div>
          </div>
        </div>
      )}

      {/* External Apply Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-955 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fadeIn text-zinc-100 p-6 space-y-6">
            <div className="space-y-2 text-left">
              <h3 className="font-semibold text-lg tracking-tight">Confirm External Application</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-sans">
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
    </FocusTrap>
  );
};

export default JobDetailsDrawer;
