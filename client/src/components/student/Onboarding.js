import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, ChevronRight, CheckCircle } from 'lucide-react';

const Onboarding = () => {
  const { user, login } = useAuth(); // Need login to update context user
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    section: '',
    rollNumber: '',
    cgpa: '',
    tenthPercent: '',
    twelfthPercent: '',
    activeBacklogs: 0,
    skills: ''
  });
  const [file, setFile] = useState(null);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload your resume PDF.");
    
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('resume', file);

    try {
      const res = await axios.post('/students/onboard', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update local user state via login function (it acts as a context updater too if passed user object)
      // Actually we just need to refresh page or redirect. 
      // If our AuthContext uses localStorage, let's just reload.
      window.location.href = "/student";
    } catch (error) {
      console.error(error);
      alert("Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to PlaceIQ!</h1>
        <p className="text-gray-500">Let's set up your profile to match you with the best jobs.</p>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mt-6">
          <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`h-2 flex-1 rounded ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Academic Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Department</label>
                <input required type="text" className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Section</label>
                <input required type="text" className="w-full p-2 border rounded" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="e.g. A" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Roll Number</label>
                <input required type="text" className="w-full p-2 border rounded" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Current CGPA</label>
                <input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.cgpa} onChange={e => setFormData({...formData, cgpa: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="mt-6 w-full bg-primary-600 text-white py-2 rounded flex justify-center items-center gap-2">Next <ChevronRight size={18} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Past Academics & Skills</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">10th Percentage</label>
                <input required type="number" step="0.1" className="w-full p-2 border rounded" value={formData.tenthPercent} onChange={e => setFormData({...formData, tenthPercent: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">12th Percentage</label>
                <input required type="number" step="0.1" className="w-full p-2 border rounded" value={formData.twelfthPercent} onChange={e => setFormData({...formData, twelfthPercent: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Active Backlogs</label>
                <input required type="number" className="w-full p-2 border rounded" value={formData.activeBacklogs} onChange={e => setFormData({...formData, activeBacklogs: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1 mt-4">Top Skills (comma separated)</label>
              <input required type="text" className="w-full p-2 border rounded" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. React, Node, Python" />
            </div>
            <div className="flex gap-4 mt-6">
              <button type="button" onClick={handleBack} className="w-1/3 bg-gray-100 text-gray-700 py-2 rounded">Back</button>
              <button type="submit" className="w-2/3 bg-primary-600 text-white py-2 rounded flex justify-center items-center gap-2">Next <ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
            <p className="text-gray-500 text-sm mb-4">Upload your PDF resume. We will parse it and use it to instantly match you with jobs using our ATS AI.</p>
            
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload size={40} className="text-primary-500 mb-3" />
              <span className="text-gray-700 font-medium">Click to select PDF</span>
              <span className="text-gray-400 text-sm mt-1">{file ? file.name : "No file selected"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={handleBack} className="w-1/3 bg-gray-100 text-gray-700 py-2 rounded">Back</button>
              <button type="submit" disabled={loading} className="w-2/3 bg-primary-600 text-white py-2 rounded flex justify-center items-center gap-2">
                {loading ? 'Uploading...' : <><CheckCircle size={18} /> Complete Onboarding</>}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Onboarding;
