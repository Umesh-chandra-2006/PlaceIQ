import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Upload, ChevronRight, CheckCircle, Loader2, Plus, X } from 'lucide-react';

const PREDEFINED_SKILLS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'Git', 'HTML/CSS', 
  'Data Structures', 'Machine Learning', 'TypeScript', 'Docker', 'AWS'
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [collegeConfig, setCollegeConfig] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    department: '',
    section: '',
    rollNumber: '',
    cgpa: '',
    tenthPercent: '',
    twelfthPercent: '',
    activeBacklogs: 0
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get('/students/college-config');
        setCollegeConfig(data);
        if (data.departments?.length > 0) {
          setFormData(prev => ({ ...prev, department: data.departments[0] }));
        }
      } catch (error) {
        console.error("Failed to fetch college config", error);
      }
    };
    fetchConfig();
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const cleanSkill = customSkill.trim();
    if (cleanSkill && !selectedSkills.includes(cleanSkill)) {
      setSelectedSkills([...selectedSkills, cleanSkill]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload your resume PDF.");
    
    setLoading(true);
    setUploadProgress(0);
    const data = new FormData();
    
    // Append all text form data
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Append skills list
    data.append('skills', selectedSkills.join(', '));
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
        window.location.href = "/student";
      }, 1500);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to complete onboarding.");
      setLoading(false);
    }
  };

  if (!collegeConfig) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-100">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-6 bg-zinc-900 p-8 rounded-lg border border-zinc-800 text-zinc-100 font-sans shadow-xl">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Welcome to PlaceIQ</h1>
        <p className="text-zinc-400 text-sm mt-2">Complete your profile to access the job feed.</p>
        
        {/* Progress Bar steps */}
        <div className="flex items-center gap-2 mt-8 max-w-xs mx-auto">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-zinc-800'}`}></div>
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-zinc-800'}`}></div>
          <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-primary-500' : 'bg-zinc-800'}`}></div>
        </div>
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-semibold text-zinc-200 mb-6 uppercase tracking-wider text-xs">Academic Details</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Department</label>
                <select 
                  required 
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})}
                >
                  {collegeConfig.departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Section</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950 placeholder-zinc-600 font-mono" 
                  value={formData.section} 
                  onChange={e => setFormData({...formData, section: e.target.value})} 
                  placeholder="e.g. A" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Roll Number</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm font-mono focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.rollNumber} 
                  onChange={e => setFormData({...formData, rollNumber: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Current CGPA (Out of {collegeConfig.cgpaScale})</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  max={collegeConfig.cgpaScale} 
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm font-mono focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.cgpa} 
                  onChange={e => {
                    let val = e.target.value;
                    if (val !== "") {
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > collegeConfig.cgpaScale) {
                        val = collegeConfig.cgpaScale.toString();
                      }
                    }
                    setFormData({...formData, cgpa: val});
                  }} 
                />
              </div>
            </div>
            <button type="submit" className="mt-8 w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 py-2.5 rounded-md text-sm font-semibold transition-colors flex justify-center items-center gap-2">Continue <ChevronRight size={16} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-semibold text-zinc-200 mb-6 uppercase tracking-wider text-xs">Past Academics & Skills</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">10th %</label>
                <input 
                  required 
                  type="number" 
                  step="0.1" 
                  max="100" 
                  min="0"
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm font-mono focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.tenthPercent} 
                  onChange={e => {
                    let val = e.target.value;
                    if (val !== "") {
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 100) {
                        val = "100";
                      }
                    }
                    setFormData({...formData, tenthPercent: val});
                  }} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">12th %</label>
                <input 
                  required 
                  type="number" 
                  step="0.1" 
                  max="100" 
                  min="0"
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm font-mono focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.twelfthPercent} 
                  onChange={e => {
                    let val = e.target.value;
                    if (val !== "") {
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 100) {
                        val = "100";
                      }
                    }
                    setFormData({...formData, twelfthPercent: val});
                  }} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Active Backlogs</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm font-mono focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-zinc-100 bg-zinc-950" 
                  value={formData.activeBacklogs} 
                  onChange={e => setFormData({...formData, activeBacklogs: e.target.value})} 
                />
              </div>
            </div>

            {/* Skills Tagging Interface */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Select Skills</label>
              
              <div className="flex flex-wrap gap-2 mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                {PREDEFINED_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected 
                          ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30' 
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowOtherInput(!showOtherInput)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    showOtherInput 
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                      : 'bg-zinc-950 text-zinc-500 border-dashed border-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  {showOtherInput ? 'Cancel Other' : '+ Other'}
                </button>
              </div>

              {/* Dynamic Add custom tag input */}
              {showOtherInput && (
                <div className="flex items-center gap-2 mb-4 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Type a skill..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-zinc-800 bg-zinc-950 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomSkill(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-100 rounded text-sm hover:bg-zinc-700 flex items-center gap-1 font-medium border border-zinc-700"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              )}

              {/* Display of currently selected skills (with remove functionality) */}
              {selectedSkills.length > 0 && (
                <div>
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Selected ({selectedSkills.length})</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-zinc-950 p-2.5 rounded border border-zinc-850">
                    {selectedSkills.map(skill => (
                      <span key={skill} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-mono">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-zinc-500 hover:text-red-400">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={handleBack} className="w-1/3 border border-zinc-800 text-zinc-300 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors">Back</button>
              <button type="submit" className="w-2/3 bg-primary-500 hover:bg-primary-400 text-zinc-950 py-2.5 rounded-md text-sm font-semibold transition-colors flex justify-center items-center gap-2">Continue <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-semibold text-zinc-200 mb-2 uppercase tracking-wider text-xs">Upload Resume</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Upload your PDF resume. Our ATS parser will extract key information and match you with eligible listings automatically.</p>
            
            {uploadSuccess ? (
              <div className="border border-emerald-500/30 bg-emerald-500/10 text-primary-400 p-8 rounded-lg flex flex-col items-center justify-center text-center gap-3 animate-fadeIn">
                <CheckCircle size={48} className="text-primary-500" />
                <span className="font-semibold text-lg">Profile Setup Complete!</span>
                <span className="text-zinc-400 text-xs">Redirecting to your student dashboard...</span>
              </div>
            ) : (
              <>
                <label className="border border-dashed border-zinc-800 bg-zinc-950 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/40 transition-colors relative overflow-hidden">
                  <Upload size={32} className="text-zinc-500 mb-4" />
                  <span className="text-zinc-200 text-sm font-medium">Select PDF File</span>
                  <span className="text-zinc-500 text-xs mt-2 font-mono">{file ? file.name : "Maximum file size: 5MB"}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>

                {/* Progress Bar */}
                {loading && (
                  <div className="space-y-2 mt-4 animate-fadeIn">
                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                      <span>{uploadProgress < 100 ? "Uploading resume..." : "Processing ATS extract..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={handleBack} className="w-1/3 border border-zinc-800 text-zinc-300 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors">Back</button>
                  <button type="submit" disabled={loading} className="w-2/3 bg-primary-500 hover:bg-primary-400 text-zinc-950 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {loading ? (
                      <><Loader2 className="animate-spin" size={16} /> {uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...'}</>
                    ) : (
                      <><CheckCircle size={16} /> Complete Setup</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default Onboarding;
