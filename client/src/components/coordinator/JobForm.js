/**
 * Form component to create or edit job listings.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

const JobForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
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
      
      // Automatically trigger AI summarization after posting
      if (formData.description) {
        setSummarizing(true);
        try {
          await axios.post(`/jobs/${job._id}/summarise`);
        } catch (err) {
          console.error("AI Summarization failed", err);
        } finally {
          setSummarizing(false);
        }
      }
      
      navigate('/coordinator/jobs');
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={20} /> Back to Jobs
      </button>

      <h1 className="text-2xl font-bold mb-8">Post New Job Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input 
              required name="title" value={formData.title} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input 
              required name="company" value={formData.company} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Google"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea 
              required name="description" value={formData.description} onChange={handleChange} rows="6"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Paste the full job description here..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTC (Package)</label>
            <input 
              name="ctc" value={formData.ctc} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. 12 LPA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input 
              name="location" value={formData.location} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Bangalore / Remote"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input 
              type="date" name="deadline" value={formData.deadline} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min CGPA</label>
            <input 
              type="number" step="0.1" name="eligibility.minCgpa" value={formData.eligibility.minCgpa} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Backlogs</label>
            <input 
              type="number" name="eligibility.maxActiveBacklogs" value={formData.eligibility.maxActiveBacklogs} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min 10th %</label>
            <input 
              type="number" name="eligibility.minTenthPercent" value={formData.eligibility.minTenthPercent} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min 12th %</label>
            <input 
              type="number" name="eligibility.minTwelfthPercent" value={formData.eligibility.minTwelfthPercent} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Branches (comma separated)</label>
            <input 
              type="text" name="eligibility.branches" value={formData.eligibility.branches} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. CSE, ECE"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Departments</label>
            <input 
              type="text" name="eligibility.departments" value={formData.eligibility.departments} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Engineering, Management"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Sections</label>
            <input 
              type="text" name="eligibility.sections" value={formData.eligibility.sections} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. A, B"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            type="button" onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Post Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
