import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MapPin, DollarSign, Calendar, Sparkles, CheckCircle, Loader2, Zap, 
  Shield, GraduationCap, Clock, FileText, Check, ChevronDown, Plus, AlertCircle 
} from 'lucide-react';
import axios from '../../api/axios';
import { getFileUrl } from '../../utils/fileUtil';

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

  // Check application status for student or load candidate roster for coordinator
  useEffect(() => {
    if (!job) return;

    if (isStudent) {
      const checkApplied = async () => {
        try {
          const { data } = await axios.get('/applications');
          const userApp = data.find(app => app.jobId?._id === job._id || app.jobId === job._id);
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
  }, [job, theme]);

  const fetchCandidates = async () => {
    setLoadingApps(true);
    try {
      const { data } = await axios.get(`/applications?jobId=${job._id}`);
      setApplications(data);
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
      const { data } = await axios.get('/applications');
      const userApp = data.find(app => app.jobId?._id === job._id || app.jobId === job._id);
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
  const handleUpdateStage = async (appId, newStage) => {
    try {
      const { data } = await axios.put(`/applications/${appId}`, { stage: newStage });
      setApplications(applications.map(a => a._id === appId ? { ...a, stage: data.stage } : a));
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
      cardBg: "bg-zinc-900/30 border border-zinc-800",
      bulletText: "text-zinc-300",
      bulletDot: "text-primary-500",
      sectionHeader: "text-zinc-200 font-medium font-mono uppercase tracking-wider text-xs",
      label: "text-zinc-555 font-mono uppercase text-[10px]",
      value: "text-zinc-300 font-mono text-sm",
      borderLine: "border-t border-zinc-900",
      badge: "bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono text-[10px] uppercase",
      actionBtnSecondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
    },
    coordinator: {
      drawerBg: "bg-zinc-955 text-zinc-100 border-l border-zinc-800 font-sans",
      overlayBg: "bg-black/60 backdrop-blur-xs",
      headerBorder: "border-b border-zinc-800",
      closeBtn: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
      metaText: "text-zinc-400 font-mono",
      cardBg: "bg-zinc-900/30 border border-zinc-800",
      bulletText: "text-zinc-300",
      bulletDot: "text-primary-500",
      sectionHeader: "text-zinc-200 font-medium font-mono uppercase tracking-wider text-xs",
      label: "text-zinc-555 font-mono uppercase text-[10px]",
      value: "text-zinc-300 font-mono text-sm",
      borderLine: "border-t border-zinc-900",
      badge: "bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono text-[10px] uppercase",
      actionBtnSecondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
    }
  }[theme];

  const renderBulletPoints = (text) => {
    if (!text || text === 'N/A') return null;
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const cleanedLine = line.replace(/^[\u2022\-\*\#\d+\.\s]+/, '').trim();
          return (
            <li key={idx} className={`text-sm flex items-start gap-2.5 leading-relaxed ${styles.bulletText}`}>
              <span className={`mt-1 font-bold ${styles.bulletDot}`}>•</span>
              <span>{cleanedLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className={`absolute inset-0 transition-opacity ${styles.overlayBg}`} onClick={onClose} />

      {/* Drawer Panel */}
      <div className={`relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 animate-slideOver ${styles.drawerBg}`}>
        {/* Header */}
        <div className={`p-6 flex flex-col gap-4 ${styles.headerBorder}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl font-bold tracking-tight truncate">{job.title}</h2>
              <p className="text-sm font-medium text-primary-500 mt-1">{job.company}</p>
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
              {/* Metadata Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
                  <MapPin size={15} className="text-zinc-400 mb-1" />
                  <span className={styles.label}>Location</span>
                  <span className="text-xs font-semibold mt-0.5 truncate max-w-full">{job.location || 'N/A'}</span>
                </div>
                <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
                  <DollarSign size={15} className="text-zinc-400 mb-1" />
                  <span className={styles.label}>Stipend</span>
                  <span className="text-xs font-semibold mt-0.5 font-mono truncate max-w-full">{job.stipend || job.ctc || 'N/A'}</span>
                </div>
                <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
                  <Calendar size={15} className="text-zinc-400 mb-1" />
                  <span className={styles.label}>Deadline</span>
                  <span className="text-xs font-semibold mt-0.5 font-mono truncate max-w-full">
                    {job.deadline && !isNaN(new Date(job.deadline))
                      ? new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Work Mode / Duration Details */}
              {(job.workMode && job.workMode !== 'N/A') || job.duration ? (
                <div className="grid grid-cols-2 gap-3">
                  {job.workMode && job.workMode !== 'N/A' && (
                    <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
                      <Shield size={15} className="text-zinc-400 mb-1" />
                      <span className={styles.label}>Work Mode</span>
                      <span className="text-xs font-semibold mt-0.5 capitalize">
                        {job.workMode === 'inoffice' ? '🏢 In Office' : job.workMode === 'remote' ? '🏠 Remote' : '🔀 Hybrid'}
                      </span>
                    </div>
                  )}
                  {job.duration && (
                    <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
                      <Clock size={15} className="text-zinc-400 mb-1" />
                      <span className={styles.label}>Duration</span>
                      <span className="text-xs font-semibold mt-0.5">{job.duration}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Roles & Responsibilities */}
              {(() => {
                const content = (job.rolesAndResponsibilities && job.rolesAndResponsibilities !== 'N/A')
                  ? job.rolesAndResponsibilities
                  : (job.description && job.description !== 'No description found.' && job.description !== 'N/A')
                  ? job.description
                  : null;
                return content ? (
                  <div className="space-y-2">
                    <h3 className={styles.sectionHeader}>Roles &amp; Responsibilities</h3>
                    {renderBulletPoints(content)}
                  </div>
                ) : null;
              })()}

              {/* Requirements */}
              {job.requirements && job.requirements !== 'N/A' && (
                <div className="space-y-2">
                  <h3 className={styles.sectionHeader}>Requirements &amp; Skills</h3>
                  {renderBulletPoints(job.requirements)}
                </div>
              )}

              {/* Eligibility Criteria */}
              {job.eligibility && (
                <div className="space-y-4">
                  <h3 className={styles.sectionHeader}>Eligibility Criteria</h3>
                  {job.eligibility.description && job.eligibility.description !== 'N/A' && (
                    <p className={`text-sm leading-relaxed italic ${styles.bulletText}`}>{job.eligibility.description}</p>
                  )}
                  <div className={`grid grid-cols-2 gap-3 p-4 rounded-lg ${styles.cardBg}`}>
                    {[
                      ['Experience',         job.eligibility.experience],
                      ['Min CGPA',           job.eligibility.minCgpa],
                      ['Max Backlogs',       typeof job.eligibility.maxBacklogs === 'number' ? `${job.eligibility.maxBacklogs} allowed` : null],
                      ['Max Active Backlogs',typeof job.eligibility.maxActiveBacklogs === 'number' ? job.eligibility.maxActiveBacklogs : null],
                      ['Min 10th %',         typeof job.eligibility.minTenthPercent === 'number' && job.eligibility.minTenthPercent > 0 ? job.eligibility.minTenthPercent : null],
                      ['Min 12th %',         typeof job.eligibility.minTwelfthPercent === 'number' && job.eligibility.minTwelfthPercent > 0 ? job.eligibility.minTwelfthPercent : null],
                      ['Target Batch Years', job.eligibility.batchYears?.length ? job.eligibility.batchYears.join(', ') : null],
                    ].filter(([label, v], i, arr) => {
                      const firstIdx = arr.findIndex(([l]) => l === label);
                      if (firstIdx !== i) return false;
                      return v !== null && v !== undefined && v !== 'N/A' && v !== '';
                    }).map(([label, value]) => (
                      <div key={label}>
                        <span className={`block text-[10px] uppercase tracking-wider ${styles.label}`}>{label}</span>
                        <span className={styles.value}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Interview Progress & Offer Upload Workspace */}
              {isStudent && studentApplication && (
                <div className="space-y-6 pt-6 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold tracking-wider font-mono text-zinc-300 uppercase">Your Application Tracking</h3>
                  
                  {/* Interview rounds list */}
                  {studentApplication.interviewRounds?.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-zinc-400 font-mono block">Scheduled Interview Rounds:</span>
                      <div className="space-y-2.5">
                        {studentApplication.interviewRounds.map((round) => (
                          <div key={round._id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-start text-xs font-mono">
                            <div>
                              <div className="font-semibold text-zinc-200">Round {round.roundNumber}: {round.roundType}</div>
                              <div className="text-[10px] text-zinc-500 mt-1">Date: {round.scheduledAt ? new Date(round.scheduledAt).toLocaleString() : 'N/A'}</div>
                              {round.feedback && <div className="text-zinc-400 mt-2 bg-zinc-950 p-2 rounded border border-zinc-850 font-sans">{round.feedback}</div>}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              round.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500' :
                              round.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>{round.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-550 italic font-mono">No interview rounds scheduled yet.</p>
                  )}

                  {/* Offer letter upload form */}
                  {studentApplication.stage === "offer" || (studentApplication.offerDetails && studentApplication.offerDetails.offerLetterUrl) ? (
                    <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-4 text-xs font-mono">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                        <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">Offer Letter Verification Vault</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          studentApplication.offerDetails?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
                          studentApplication.offerDetails?.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {studentApplication.offerDetails?.status?.replace('_', ' ') || 'pending_upload'}
                        </span>
                      </div>

                      {studentApplication.offerDetails?.offerLetterUrl ? (
                        <div className="space-y-3 font-sans">
                          <p className="text-xs text-zinc-450 leading-relaxed font-mono">
                            Offer details submitted on: {new Date(studentApplication.offerDetails.uploadedAt).toLocaleDateString()}
                          </p>
                          {studentApplication.offerDetails.ctc && (
                            <p className="text-xs font-mono text-zinc-300">
                              Compensation Package: <strong className="text-zinc-100">{studentApplication.offerDetails.ctc}</strong>
                            </p>
                          )}
                          <div className="flex gap-4 text-xs font-mono">
                            <a 
                              href={getFileUrl(studentApplication.offerDetails.offerLetterUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary-500 hover:text-primary-400 underline font-semibold flex items-center gap-1.5"
                            >
                              <FileText size={14} /> Open Offer PDF
                            </a>
                          </div>
                          {studentApplication.offerDetails.reviewNotes && (
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs font-mono mt-3">
                              <span className="text-zinc-550 block text-[9px] uppercase tracking-wider mb-1 font-bold">Reviewer Feedback:</span>
                              <p className="text-zinc-400 font-sans">{studentApplication.offerDetails.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {(!studentApplication.offerDetails || studentApplication.offerDetails.status === 'rejected') && (
                        <form onSubmit={handleOfferUploadSubmit} className="space-y-3 font-sans pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">Offered CTC / Package</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 12 LPA or 35k/m" 
                                required
                                value={ctcInput}
                                onChange={e => setCtcInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">PDF Document</label>
                              <button 
                                type="button"
                                onClick={() => offerFileInputRef.current.click()}
                                className="w-full text-center px-2.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-800 font-mono"
                              >
                                {offerFile ? offerFile.name : "Select PDF File"}
                              </button>
                              <input 
                                type="file" 
                                ref={offerFileInputRef}
                                accept=".pdf"
                                className="hidden"
                                required
                                onChange={e => setOfferFile(e.target.files[0] || null)}
                              />
                            </div>
                          </div>

                          <button 
                            type="submit" 
                            disabled={uploadingOffer || !offerFile}
                            className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                          >
                            {uploadingOffer && <Loader2 className="animate-spin" size={12} />}
                            Upload Offer Letter For Verification
                          </button>
                        </form>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            /* Coordinator Candidates Tab Workspace */
            <div className="space-y-6">
              {loadingApps ? (
                <div className="text-center py-12 text-zinc-550 text-xs font-mono">Loading candidates roster...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16 text-zinc-550 text-xs font-mono border border-zinc-850 rounded bg-zinc-900/10">
                  0 applications submitted for this job yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map(app => (
                    <div key={app._id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-4">
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
                          
                          {/* Main Stage Select */}
                          <select 
                            value={app.stage}
                            onChange={(e) => handleUpdateStage(app._id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 font-semibold px-2 py-1 focus:outline-none"
                          >
                            <option value="applied">Applied</option>
                            <option value="oa">OA (Test)</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      {/* Display Interview rounds under candidate if in interview stage */}
                      {app.stage === "interview" && (
                        <div className="border-t border-zinc-850/50 pt-3 space-y-3 font-mono text-xs">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                            <span>Interview Rounds Tracking</span>
                            <button 
                              onClick={() => setSelectedAppForRound(selectedAppForRound === app._id ? null : app._id)}
                              className="text-primary-500 hover:text-primary-400 flex items-center gap-1 font-semibold"
                            >
                              <Plus size={12} /> Schedule Round
                            </button>
                          </div>

                          {/* Round scheduling form */}
                          {selectedAppForRound === app._id && (
                            <form onSubmit={(e) => handleAddRoundSubmit(e, app._id)} className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
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

                          {app.interviewRounds?.length > 0 ? (
                            <div className="space-y-2">
                              {app.interviewRounds.map(round => (
                                <div key={round._id} className="bg-zinc-950 p-2.5 rounded border border-zinc-850 flex justify-between items-start text-[11px]">
                                  <div>
                                    <span className="font-semibold text-zinc-300">Round {round.roundNumber}: {round.roundType}</span>
                                    <span className="text-[9px] text-zinc-500 block mt-0.5">Date: {round.scheduledAt ? new Date(round.scheduledAt).toLocaleString() : 'N/A'}</span>
                                    {round.notes && <span className="text-zinc-500 text-[9px] block mt-0.5">Notes: {round.notes}</span>}
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
                                          onClick={() => handleRoundStatusUpdate(app._id, round._id, 'passed')}
                                          className="text-emerald-500 hover:underline"
                                        >
                                          Pass
                                        </button>
                                        <span className="text-zinc-700">|</span>
                                        <button 
                                          onClick={() => handleRoundStatusUpdate(app._id, round._id, 'failed')}
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
                      )}

                      {/* Display Offer verification actions under candidate if offer letter exists */}
                      {app.offerDetails?.offerLetterUrl && (
                        <div className="border-t border-zinc-850/50 pt-3 space-y-3 font-mono text-xs font-semibold">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Offer Letter Submission</span>
                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex justify-between items-center">
                            <div className="font-sans text-xs">
                              <p className="text-zinc-400 font-mono">Package Offered: <strong className="text-zinc-200">{app.offerDetails.ctc || 'N/A'}</strong></p>
                              <a 
                                href={getFileUrl(app.offerDetails.offerLetterUrl)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary-500 hover:text-primary-400 underline font-mono text-[10px] mt-1.5 inline-flex items-center gap-1 font-semibold"
                              >
                                <FileText size={12} /> Inspect Uploaded PDF
                              </a>
                            </div>

                            {app.offerDetails.status === "pending_review" ? (
                              <div className="flex gap-2 text-[10px]">
                                <button 
                                  onClick={() => handleVerifyOffer(app._id, 'rejected')}
                                  className="px-2 py-1 bg-red-950/20 text-red-500 hover:bg-red-950/40 border border-red-900/30 rounded"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleVerifyOffer(app._id, 'verified')}
                                  className="px-2.5 py-1 bg-emerald-500 text-zinc-950 font-bold rounded hover:bg-emerald-400"
                                >
                                  Approve
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                app.offerDetails.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {app.offerDetails.status}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <div className="bg-zinc-955 p-4 rounded-lg border border-zinc-800 mt-6">
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
  );
};

export default JobDetailsDrawer;
