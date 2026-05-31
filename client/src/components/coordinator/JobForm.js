import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api/axios';
import { ArrowLeft, Loader2, Briefcase, GraduationCap } from 'lucide-react';

const JobForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    ctc: '',
    location: '',
    jobType: 'fulltime',
    deadline: '',
    eligibility: {
      branches: 'CSE, ECE',
      departments: '',
      sections: '',
      batchIds: '',
      minCgpa: 0,
      maxBacklogs: 0,
      maxActiveBacklogs: 0,
      minTenthPercent: 0,
      minTwelfthPercent: 0,
      batchYears: '2026',
      placementStatus: 'not_placed'
    },
    status: 'active'
  });

  useEffect(() => {
    if (location.state?.scrapedData) {
      const { title, company, description, ctc, location: loc } = location.state.scrapedData;
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        company: company || prev.company,
        description: description || prev.description,
        ctc: ctc || prev.ctc,
        location: loc || prev.location
      }));
    }
  }, [location.state]);

  const applyTemplate = (type) => {
    if (type === 'job') {
      setFormData(prev => ({
        ...prev,
        jobType: 'fulltime',
        eligibility: {
          ...prev.eligibility,
          minCgpa: 7.5,
          maxActiveBacklogs: 0,
          batchYears: '2026'
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        jobType: 'internship',
        eligibility: {
          ...prev.eligibility,
          minCgpa: 6.5,
          maxActiveBacklogs: 2,
          batchYears: '2027'
        }
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        eligibility: {
          ...formData.eligibility,
          branches: typeof formData.eligibility.branches === 'string' ? formData.eligibility.branches.split(',').map(s=>s.trim()).filter(Boolean) : formData.eligibility.branches,
          departments: typeof formData.eligibility.departments === 'string' ? formData.eligibility.departments.split(',').map(s=>s.trim()).filter(Boolean) : formData.eligibility.departments,
          sections: typeof formData.eligibility.sections === 'string' ? formData.eligibility.sections.split(',').map(s=>s.trim()).filter(Boolean) : formData.eligibility.sections,
          batchYears: typeof formData.eligibility.batchYears === 'string' ? formData.eligibility.batchYears.split(',').map(s=>Number(s.trim())).filter(Boolean) : formData.eligibility.batchYears,
          batchIds: typeof formData.eligibility.batchIds === 'string' ? formData.eligibility.batchIds.split(',').map(s=>s.trim()).filter(Boolean) : formData.eligibility.batchIds,
          placementStatus: typeof formData.eligibility.placementStatus === 'string' ? formData.eligibility.placementStatus.split(',').map(s=>s.trim()).filter(Boolean) : formData.eligibility.placementStatus
        }
      };
      const { data: job } = await axios.post('/jobs', payload);
      
      if (formData.description) {
        axios.post(`/jobs/${job._id}/summarise`).catch(console.error); // Fire and forget
      }
      
      navigate('/coordinator/jobs');
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-zinc-100">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-medium tracking-tight mb-6">Post New Listing</h1>

      <div className="flex gap-4 mb-6">
        <button 
          type="button"
          onClick={() => applyTemplate('job')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
        >
          <Briefcase size={18} className="text-primary-500" />
          <div className="text-left">
            <div className="text-sm font-medium">Standard Job Template</div>
            <div className="text-xs text-zinc-500">Min 7.5 CGPA, 0 Active Backlogs</div>
          </div>
        </button>
        <button 
          type="button"
          onClick={() => applyTemplate('internship')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
        >
          <GraduationCap size={18} className="text-emerald-500" />
          <div className="text-left">
            <div className="text-sm font-medium">Internship Template</div>
            <div className="text-xs text-zinc-500">Min 6.5 CGPA, Allows 2 Backlogs</div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Job Title</label>
            <input 
              required name="title" value={formData.title} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Company</label>
            <input 
              required name="company" value={formData.company} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="e.g. Google"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea 
              required name="description" value={formData.description} onChange={handleChange} rows="6"
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 resize-y"
              placeholder="Paste raw JD..."
            ></textarea>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">CTC</label>
            <input 
              name="ctc" value={formData.ctc} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="12 LPA"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Location</label>
            <input 
              name="location" value={formData.location} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="Bangalore"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Deadline</label>
            <input 
              type="date" name="deadline" value={formData.deadline} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Min CGPA</label>
            <input 
              type="number" step="0.1" name="eligibility.minCgpa" value={formData.eligibility.minCgpa} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div className="col-span-2 border-t border-zinc-800 my-2 pt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Eligibility Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Max Active Backlogs</label>
                <input 
                  type="number" name="eligibility.maxActiveBacklogs" value={formData.eligibility.maxActiveBacklogs} onChange={handleChange}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Min 10th %</label>
                  <input 
                    type="number" name="eligibility.minTenthPercent" value={formData.eligibility.minTenthPercent} onChange={handleChange}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Min 12th %</label>
                  <input 
                    type="number" name="eligibility.minTwelfthPercent" value={formData.eligibility.minTwelfthPercent} onChange={handleChange}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5">Target Branches</label>
                <input 
                  type="text" name="eligibility.branches" value={formData.eligibility.branches} onChange={handleChange}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                  placeholder="CSE, ECE"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" onClick={() => navigate(-1)}
            className="px-4 py-1.5 border border-zinc-700 rounded text-sm font-medium text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" disabled={loading}
            className="px-4 py-1.5 bg-primary-500 text-zinc-950 rounded text-sm font-medium hover:bg-primary-400 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
