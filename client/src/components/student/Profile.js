import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, Zap, Loader2, Edit, Save, X } from 'lucide-react';
import { getFileUrl } from '../../utils/fileUtil';

const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [collegeConfig, setCollegeConfig] = useState({ departments: [], cgpaScale: 10 });
  const [savingProfile, setSavingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    section: '',
    rollNumber: '',
    cgpa: '',
    tenthPercent: '',
    twelfthPercent: '',
    activeBacklogs: '',
    skills: '',
    phone: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/students/me');
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile", error);
      }
    };
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get('/students/college-config');
        setCollegeConfig(data);
      } catch (error) {
        console.error("Error fetching college config", error);
      }
    };
    fetchProfile();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        department: profile.department || '',
        section: profile.section || '',
        rollNumber: profile.rollNumber || '',
        cgpa: profile.cgpa !== undefined ? String(profile.cgpa) : '',
        tenthPercent: profile.tenthPercent !== undefined ? String(profile.tenthPercent) : '',
        twelfthPercent: profile.twelfthPercent !== undefined ? String(profile.twelfthPercent) : '',
        activeBacklogs: profile.activeBacklogs !== undefined ? String(profile.activeBacklogs) : '0',
        skills: profile.skills ? profile.skills.join(', ') : '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/[\s-()+]/g, "");
    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        name: formData.name,
        department: formData.department,
        section: formData.section,
        rollNumber: formData.rollNumber,
        cgpa: formData.cgpa !== '' ? Number(formData.cgpa) : 0,
        tenthPercent: formData.tenthPercent !== '' ? Number(formData.tenthPercent) : 0,
        twelfthPercent: formData.twelfthPercent !== '' ? Number(formData.twelfthPercent) : 0,
        activeBacklogs: formData.activeBacklogs !== '' ? Number(formData.activeBacklogs) : 0,
        skills: formData.skills,
        phone: formData.phone
      };
      
      const { data } = await axios.put('/students/profile', payload);
      setProfile(data);
      setIsEditing(false);
      // Sync local user context name
      if (updateUser) {
        updateUser({ name: data.name });
      }
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    const data = new FormData();
    data.append('resume', file);

    try {
      await axios.post('/students/onboard', data, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setUploadSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to upload resume.');
      setUploading(false);
    }
  };

  if (!profile) return <div className="text-zinc-500 text-sm py-20 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto text-zinc-100 font-sans">
      <div className="mb-8 border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Profile & Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your academic details and resume.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          >
            <Edit size={14} /> Edit Profile
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-200 uppercase tracking-wider">
                {isEditing ? 'Modify Academic Details' : 'Academic Profile'}
              </h2>
              {isEditing && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                  >
                    <X size={12} /> Cancel
                  </button>
                  <button 
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="bg-primary-500 hover:bg-primary-400 text-zinc-950 px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Branch / Dept</label>
                  {collegeConfig.departments?.length > 0 ? (
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                    >
                      <option value="">Select Branch</option>
                      {collegeConfig.departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text" required
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. CSE"
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 21X01A0501"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">CGPA (Scale: {collegeConfig.cgpaScale})</label>
                  <input
                    type="number" step="0.01" min="0" max={collegeConfig.cgpaScale} required
                    value={formData.cgpa}
                    onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                    placeholder="e.g. 8.5"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Active Backlogs</label>
                  <input
                    type="number" min="0" required
                    value={formData.activeBacklogs}
                    onChange={e => setFormData({ ...formData, activeBacklogs: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">10th %</label>
                  <input
                    type="number" step="0.01" min="0" max="100" required
                    value={formData.tenthPercent}
                    onChange={e => setFormData({ ...formData, tenthPercent: e.target.value })}
                    placeholder="e.g. 92.5"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">12th %</label>
                  <input
                    type="number" step="0.01" min="0" max="100" required
                    value={formData.twelfthPercent}
                    onChange={e => setFormData({ ...formData, twelfthPercent: e.target.value })}
                    placeholder="e.g. 94.2"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-550 text-[10px] uppercase tracking-wider mb-1.5 font-mono">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, Node.js, Python, MongoDB"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-6 text-sm">
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Name</span>
                  <span className="font-semibold text-zinc-100">{profile.name}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Email</span>
                  <span className="text-zinc-300">{profile.email}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Branch / Dept</span>
                  <span className="text-zinc-300">{profile.branch} / {profile.department || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Section / Roll</span>
                  <span className="text-zinc-300">{profile.section || '-'} / {profile.rollNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Phone</span>
                  <span className="font-mono text-zinc-300">{profile.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">CGPA</span>
                  <span className="font-mono font-semibold text-zinc-100">{profile.cgpa || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">Active Backlogs</span>
                  <span className="font-mono text-zinc-100">{profile.activeBacklogs || 0}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">10th %</span>
                  <span className="font-mono text-zinc-300">{profile.tenthPercent ? `${profile.tenthPercent}%` : '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-1 font-medium font-mono">12th %</span>
                  <span className="font-mono text-zinc-300">{profile.twelfthPercent ? `${profile.twelfthPercent}%` : '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-550 block text-xs uppercase tracking-widest mb-2 font-medium font-mono">Extracted Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills?.length > 0 ? (
                      profile.skills.map(s => (
                        <span key={s} className="bg-zinc-950 text-primary-400 border border-zinc-800 px-2 py-0.5 rounded-md text-xs font-mono">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 text-xs italic">No skills extracted.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 text-white" id="ai-quota-card">
            <h2 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
              <Zap size={16} className="text-primary-400" /> AI Quota
            </h2>
            <div className="flex items-center gap-5 mb-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-zinc-800"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-primary-500 transition-all duration-500"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.max(0, (collegeConfig.aiReviewQuota || 3) - (profile.aiReviewsUsed || 0)) / (collegeConfig.aiReviewQuota || 3))}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold tracking-tight">{Math.max(0, (collegeConfig.aiReviewQuota || 3) - (profile.aiReviewsUsed || 0))}</span>
                  <span className="text-[9px] text-zinc-500 font-mono -mt-1 font-bold">LEFT</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Monthly quota of deep AI ATS reviews. Resets periodically.
                </p>
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: collegeConfig.aiReviewQuota || 3 }).map((_, index) => {
                    const num = index + 1;
                    const remaining = Math.max(0, (collegeConfig.aiReviewQuota || 3) - (profile.aiReviewsUsed || 0));
                    const isActive = remaining >= num;
                    return (
                      <div 
                        key={num} 
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          isActive 
                            ? 'bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'bg-zinc-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-zinc-800/60 pt-3 flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-550 uppercase tracking-widest">
                Resets: {profile.aiReviewResetDate && !isNaN(new Date(profile.aiReviewResetDate)) ? new Date(profile.aiReviewResetDate).toLocaleDateString() : 'N/A'}
              </span>
              <button 
                onClick={async () => {
                  localStorage.removeItem(`has-completed-tour-student`);
                  try {
                    await axios.put('/auth/reset-tour');
                  } catch (e) {}
                  alert("Onboarding walkthrough tour reset. Redirecting to job feed...");
                  window.location.href = '/student';
                }}
                className="uppercase font-bold text-primary-500 hover:text-primary-400 transition-colors"
              >
                Restart Tour
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800" id="resume-upload-card">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-200 mb-4 uppercase tracking-wider flex items-center gap-2">Resume</h2>
            {profile.resumeUrl ? (
              <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-md">
                <p className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-1">
                  <CheckCircle size={14} /> Active Resume
                </p>
                <p className="text-[10px] font-mono text-zinc-500">
                  Updated: {profile.resumeUpdatedAt && !isNaN(new Date(profile.resumeUpdatedAt)) ? new Date(profile.resumeUpdatedAt).toLocaleDateString() : 'N/A'}
                </p>
                <a 
                  href={getFileUrl(profile.resumeUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary-500 hover:text-primary-400 font-mono mt-2 block underline"
                >
                  View Current PDF
                </a>
              </div>
            ) : (
              <p className="text-sm text-red-400 mb-6 bg-red-950/20 p-3 rounded border border-red-900/30">No resume uploaded.</p>
            )}

            {uploadSuccess ? (
              <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400 font-medium flex items-center gap-1.5 animate-fadeIn mb-3">
                <CheckCircle size={14} className="text-primary-500 flex-shrink-0" />
                <span>Resume Updated Successfully! Refreshing...</span>
              </div>
            ) : null}

            <form onSubmit={handleResumeUpload} className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-400">Upload New PDF</label>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-md transition-colors"
                >
                  Choose PDF File
                </button>
                <span className="text-xs text-zinc-400 truncate max-w-[155px]">
                  {file ? file.name : "No file selected"}
                </span>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf" 
                style={{ display: 'none' }}
                required 
                onChange={e => setFile(e.target.files[0])} 
              />
              
              {uploading && (
                <div className="space-y-1 mt-2 animate-fadeIn">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{uploadProgress < 100 ? "Uploading..." : "Parsing..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 border border-zinc-850 rounded-full h-1 overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full transition-all duration-355" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button 
                disabled={uploading || !file} 
                type="submit" 
                className="w-full bg-primary-500 text-zinc-950 hover:bg-primary-400 py-1.5 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition-colors mt-2 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Upload size={14} />
                )}
                {uploading ? 'Processing...' : 'Upload PDF'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
