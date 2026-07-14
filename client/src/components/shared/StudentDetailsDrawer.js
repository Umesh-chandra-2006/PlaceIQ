import React, { useState, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, User, GraduationCap, Award, FileText, Clock } from 'lucide-react';
import axios from '../../api/axios';
import { getFileUrl } from '../../utils/fileUtil';

const StudentDetailsDrawer = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "applications"
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load student applications
  useEffect(() => {
    if (!student) return;
    const fetchApplications = async () => {
      setLoadingApps(true);
      try {
        const { data } = await axios.get(`/applications?limit=1000`);
        const list = data && data.data ? data.data : (Array.isArray(data) ? data : []);
        // Filter applications belonging to this student
        const filtered = list.filter(app => {
          const studentId = app.studentId?._id || app.studentId;
          return studentId === student._id;
        });
        setApplications(filtered);
      } catch (err) {
        console.error("Failed to load student applications:", err);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApplications();
  }, [student]);

  if (!student) return null;

  return (
    <FocusTrap active={true} focusTrapOptions={{ clickOutsideDeactivates: true }}>
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 animate-slideOver bg-zinc-950 text-zinc-100 border-l border-zinc-800 font-sans">
          
          {/* Header */}
          <div className="p-6 flex flex-col gap-4 border-b border-zinc-800">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-100">{student.name}</h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">{student.rollNumber || "No Roll Number"}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tab Toggles */}
            <div className="flex border-b border-zinc-800 gap-4 text-sm font-medium">
              <button 
                onClick={() => setActiveTab("profile")} 
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary-500 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Overview & Profile
              </button>
              <button 
                onClick={() => setActiveTab("applications")} 
                className={`pb-2 border-b-2 transition-colors relative flex items-center gap-1.5 ${activeTab === 'applications' ? 'border-primary-500 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Applications
                <span className="bg-zinc-900 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {applications.length}
                </span>
              </button>
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
            {activeTab === "profile" ? (
              <div className="space-y-6">
                
                {/* ── Status & Basic Info ── */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl">
                  <div>
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Placement Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase font-bold ${
                      student.placementStatus === 'not_placed' ? 'bg-zinc-800 text-zinc-400' : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    }`}>
                      {student.placementStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Account Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase font-bold ${
                      student.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {student.isActive !== false ? "Active" : "Deactivated"}
                    </span>
                  </div>
                </div>

                {/* ── Personal Info ── */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-850 pb-1.5">
                    <User size={14} className="text-primary-400" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Email Address</span>
                      <span className="text-zinc-300 font-medium">{student.email}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Phone Number</span>
                      <span className="text-zinc-300 font-medium">{student.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* ── Academic Details ── */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-850 pb-1.5">
                    <GraduationCap size={14} className="text-primary-400" />
                    Academic Profile
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Graduation Year</span>
                      <span className="text-zinc-300 font-medium font-mono">{student.year || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Branch / Course</span>
                      <span className="text-zinc-300 font-medium">{student.branch || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">CGPA</span>
                      <span className="text-zinc-300 font-medium font-mono text-primary-400 font-bold">{student.cgpa || "—"}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">10th Class %</span>
                      <span className="text-zinc-300 font-medium font-mono">{student.tenthPercent ? `${student.tenthPercent}%` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">12th Class %</span>
                      <span className="text-zinc-300 font-medium font-mono">{student.twelfthPercent ? `${student.twelfthPercent}%` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Active Backlogs</span>
                      <span className={`font-mono font-medium ${student.activeBacklogs > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {student.activeBacklogs || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">History Backlogs</span>
                      <span className="text-zinc-300 font-medium font-mono">{student.backlogs || 0}</span>
                    </div>
                  </div>
                </div>

                {/* ── Skills ── */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-850 pb-1.5">
                    <Award size={14} className="text-primary-400" />
                    Skills List
                  </h3>
                  {student.skills && student.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10.5px] rounded text-zinc-350 font-medium font-mono">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-650 italic">No skills listed yet.</p>
                  )}
                </div>

                {/* ── Resume View Link ── */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-850 pb-1.5">
                    <FileText size={14} className="text-primary-400" />
                    Student Resume
                  </h3>
                  {student.resumeUrl ? (
                    <a 
                      href={getFileUrl(student.resumeUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-primary-400 hover:text-primary-300 hover:border-zinc-700 transition-all font-mono"
                    >
                      <FileText size={14} /> Open Compiled Resume (PDF)
                    </a>
                  ) : (
                    <p className="text-xs text-zinc-650 italic">No resume uploaded/created yet.</p>
                  )}
                </div>

              </div>
            ) : (
              /* Applications Tab */
              <div className="space-y-4">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Applied Drives History</span>
                {loadingApps ? (
                  <p className="text-xs text-zinc-500 font-mono">Loading application history...</p>
                ) : applications.length === 0 ? (
                  <p className="text-xs text-zinc-650 italic">This student hasn't applied to any job drives yet.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map(app => (
                      <div key={app._id} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-200">{app.jobId?.title || "Unknown Position"}</h4>
                            <p className="text-xs text-zinc-500 font-medium">{app.jobId?.company || "Unknown Company"}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            app.stage === 'offer' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : app.stage === 'rejected' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                          }`}>
                            {app.stage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-t border-zinc-850/60 pt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}
                          </span>
                          <span>ATS Score: <strong className="text-primary-400 font-bold">{app.matchScore || 0}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </FocusTrap>
  );
};

export default StudentDetailsDrawer;
