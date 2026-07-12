import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import JobDetailsDrawer from '../shared/JobDetailsDrawer';
import Pagination from '../shared/Pagination';
import { Plus, Search, Trash2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const JobsManager = () => {
  const { user } = useAuth();
  const isPaid = user?.subRole === 'coordinator_paid';
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [scrapeUrl, setScrapeUrl] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'closed' : 'active';
      await axios.put(`/jobs/${jobId}`, { status: newStatus });
      setJobs(jobs.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch (error) {
      alert("Failed to toggle status");
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(j => j._id !== jobId));
    } catch (error) {
      alert("Failed to delete job");
    }
  };

  const fetchJobs = async (signal) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/jobs?search=${search}&page=${page}&limit=${limit}`, { signal });
      if (data && data.data) {
        setJobs(data.data);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      } else {
        setJobs(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalJobs(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error("Error fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(() => {
      fetchJobs(controller.signal);
    }, 500);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, limit]);


  return (
    <div className="space-y-4 text-zinc-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium tracking-tight">Jobs & Listings</h1>
        <div className="flex gap-2">
          <Link 
            to="/coordinator/jobs/new" 
            className="bg-primary-500 text-zinc-950 px-3 py-1.5 text-sm font-medium rounded hover:bg-primary-400 transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} /> New Job
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <button 
          onClick={() => {
            if (!isPaid) {
              alert("Upgrade to Pro plan to access AI-powered job scraping!");
              return;
            }
            setShowScrapeModal(true);
          }}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors shadow-lg ${
            isPaid 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
              : 'bg-zinc-800 text-zinc-550 border border-zinc-700 cursor-not-allowed opacity-60'
          }`}
          title={isPaid ? "Scrape external jobs via AI" : "AI scraping requires Pro license upgrade"}
        >
          Scrape External Job {!isPaid && "🔒"}
        </button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search by company or title..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="border border-zinc-800 rounded overflow-hidden bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400 font-medium">
              <tr>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">CTC</th>
                <th className="px-4 py-2 font-medium text-right">Applications</th>
                <th className="px-4 py-2 font-medium text-right">Deadline</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-zinc-500">0 listings active. <Link to="/coordinator/jobs/new" className="text-primary-500 hover:underline">Create Job</Link></td></tr>
              ) : jobs.map((job) => (
                <tr 
                  key={job._id} 
                  onClick={() => setSelectedJob(job)}
                  className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-2 font-mono text-xs text-zinc-500">{job._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-2 font-medium text-zinc-200">{job.company}</td>
                  <td className="px-4 py-2 text-zinc-400 truncate max-w-[200px]">{job.title}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                      job.status === 'active' ? 'bg-primary-500/10 text-primary-500' : 
                      job.status === 'closed' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">{job.stipend || job.ctc || '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">{job.applicationCount || 0}</td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-400">
                    {job.deadline && !isNaN(new Date(job.deadline))
                      ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => toggleJobStatus(job._id, job.status)}
                      title={job.status === 'active' ? 'Close Listing' : 'Activate Listing'}
                      className={`p-1.5 rounded transition-colors ${
                        job.status === 'active' 
                          ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' 
                          : 'text-primary-500 hover:bg-primary-955/20 hover:text-primary-405'
                      }`}
                    >
                      {job.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button 
                      onClick={() => deleteJob(job._id)}
                      title="Delete Job"
                      className="p-1.5 text-red-500 hover:bg-red-955/20 hover:text-red-405 rounded transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          page={page}
          pages={totalPages}
          limit={limit}
          total={totalJobs}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {selectedJob && (
        <JobDetailsDrawer 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          theme="coordinator"
        />
      )}

      {/* Scrape Modal Overlay */}
      {showScrapeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="font-semibold text-lg text-zinc-100">Scrape Job via AI</h2>
              <button onClick={() => { setShowScrapeModal(false); setScrapedData(null); setScrapeUrl(''); }} className="text-zinc-500 hover:text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6">
              {!scrapedData ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">Job URL</label>
                    <input 
                      type="url" 
                      value={scrapeUrl}
                      onChange={e => setScrapeUrl(e.target.value)}
                      placeholder="https://unstop.com/..." 
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!scrapeUrl) return;
                      setScraping(true);
                      try {
                        const { data } = await axios.post('/jobs/scrape', { url: scrapeUrl });
                        setScrapedData({ ...data, eligibility_description: data.eligibility?.description || '', status: 'active' });
                      } catch (error) {
                        alert("Scraping failed: " + (error.response?.data?.error || error.message));
                      } finally {
                        setScraping(false);
                      }
                    }}
                    disabled={scraping || !scrapeUrl}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold py-2 rounded transition-colors disabled:opacity-50"
                  >
                    {scraping ? 'Analyzing Page...' : 'Extract Data'}
                  </button>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
                  {/* ── Core Info ── */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-1.5 mb-2">Core Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[['1. Title', 'title'], ['2. Company', 'company'], ['3. Location', 'location'], ['4. Stipend', 'stipend']].map(([label, field]) => (
                        <div key={field}>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
                          <input
                            value={scrapedData[field] ?? ''}
                            onChange={e => setScrapedData({ ...scrapedData, [field]: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Job Type</label>
                        <select
                          value={scrapedData.jobType || 'fulltime'}
                          onChange={e => setScrapedData({ ...scrapedData, jobType: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                        >
                          <option value="fulltime">Full-time</option>
                          <option value="internship">Internship</option>
                          <option value="ppo">PPO</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Work Mode</label>
                        <select
                          value={scrapedData.workMode || 'N/A'}
                          onChange={e => setScrapedData({ ...scrapedData, workMode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                        >
                          <option value="N/A">N/A</option>
                          <option value="inoffice">🏢 In Office</option>
                          <option value="remote">🏠 Remote</option>
                          <option value="hybrid">🔀 Hybrid</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Duration</label>
                        <input
                          value={scrapedData.duration ?? ''}
                          onChange={e => setScrapedData({ ...scrapedData, duration: e.target.value })}
                          placeholder="e.g. 3 months"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">6. Deadline (YYYY-MM-DD)</label>
                        <input
                          value={scrapedData.deadline && scrapedData.deadline !== 'N/A' ? scrapedData.deadline : ''}
                          onChange={e => setScrapedData({ ...scrapedData, deadline: e.target.value })}
                          placeholder="YYYY-MM-DD or N/A"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>

                    </div>
                  </div>

                  {/* ── Eligibility ── */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-1.5 mb-2">5. Eligibility</p>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Eligibility Summary</label>
                      <textarea
                        value={scrapedData.eligibility_description ?? ''}
                        onChange={e => setScrapedData({ ...scrapedData, eligibility_description: e.target.value })}
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[['Experience', 'experience'], ['Min CGPA', 'minCgpa'], ['Max Backlogs', 'maxBacklogs'], ['Max Active Backlogs', 'maxActiveBacklogs'], ['Min 10th %', 'minTenthPercent'], ['Min 12th %', 'minTwelfthPercent']].map(([label, field]) => (
                        <div key={field}>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
                          <input
                            value={scrapedData.eligibility?.[field] ?? 'N/A'}
                            onChange={e => setScrapedData({ ...scrapedData, eligibility: { ...scrapedData.eligibility, [field]: e.target.value } })}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Eligible Branches (comma-separated)</label>
                      <input
                        value={Array.isArray(scrapedData.eligibility?.branches) ? scrapedData.eligibility.branches.join(', ') : (scrapedData.eligibility?.branches ?? '')}
                        onChange={e => setScrapedData({ ...scrapedData, eligibility: { ...scrapedData.eligibility, branches: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                        placeholder="CSE, ECE, IT or leave empty"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Batch Years (comma-separated)</label>
                      <input
                        value={Array.isArray(scrapedData.eligibility?.batchYears) ? scrapedData.eligibility.batchYears.join(', ') : ''}
                        onChange={e => setScrapedData({ ...scrapedData, eligibility: { ...scrapedData.eligibility, batchYears: e.target.value.split(',').map(s => Number(s.trim())).filter(Boolean) } })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                        placeholder="2025, 2026"
                      />
                    </div>
                  </div>

                  {/* ── Rich Content ── */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-1.5 mb-2">Job Details</p>
                    {[['7. Roles & Responsibilities', 'rolesAndResponsibilities', 4], ['8. Requirements / Skills', 'requirements', 3], ['9. Additional Info', 'additionalInfo', 2]].map(([label, field, rows]) => (
                      <div key={field}>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
                        <textarea
                          value={scrapedData[field] ?? ''}
                          onChange={e => setScrapedData({ ...scrapedData, [field]: e.target.value })}
                          rows={rows}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-y font-sans"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                    <button 
                      onClick={() => setScrapedData(null)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={async () => {
                        setScraping(true);
                        try {
                          const eligibility = {
                            ...(scrapedData.eligibility || {}),
                            description: scrapedData.eligibility_description || scrapedData.eligibility?.description,
                            placementStatus: ['not_placed']
                          };
                          const payload = {
                            ...scrapedData,
                            stipend: scrapedData.stipend,
                            ctc: scrapedData.stipend,
                            eligibility,
                            deadline: scrapedData.deadline && scrapedData.deadline !== 'N/A' ? scrapedData.deadline : undefined
                          };
                          delete payload.eligibility_description;
                          const { data: newJob } = await axios.post('/jobs', payload);
                          if (payload.description) axios.post(`/jobs/${newJob._id}/summarise`).catch(() => {});
                          setShowScrapeModal(false);
                          setScrapedData(null);
                          setScrapeUrl('');
                          const { data } = await axios.get(`/jobs?search=${search}&page=${page}&limit=${limit}`);
                          if (data && data.data) {
                            setJobs(data.data);
                            setTotalPages(data.pages || 1);
                            setTotalJobs(data.total || 0);
                          } else {
                            setJobs(Array.isArray(data) ? data : []);
                            setTotalPages(1);
                            setTotalJobs(Array.isArray(data) ? data.length : 0);
                          }
                        } catch (err) {
                          alert('Failed to publish: ' + (err.response?.data?.error || err.message));
                        } finally {
                          setScraping(false);
                        }
                      }}
                      disabled={scraping}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-sm font-semibold rounded transition-colors disabled:opacity-50"
                    >
                      {scraping ? 'Publishing...' : 'Publish to Listing'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsManager;
