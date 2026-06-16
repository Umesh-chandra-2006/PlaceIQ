import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import JobCard from './JobCard';
import JobDetailsDrawer from '../shared/JobDetailsDrawer';
import Pagination from '../shared/Pagination';
import { Search, Loader2 } from 'lucide-react';

const Feed = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchJobs = async (signal) => {
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
      console.error("Error fetching feed", error);
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
    <div className="max-w-3xl mx-auto text-zinc-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Job Feed</h1>
          <p className="text-zinc-400 text-sm mt-1">Recommended roles matching your profile.</p>
        </div>
        <div className="w-full md:w-72">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              id="job-search-input"
              type="text" placeholder="Search roles or companies..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-800 bg-zinc-950 rounded-md text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-colors placeholder-zinc-550 text-zinc-100"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-650" size={24} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-24 border border-zinc-850 rounded-lg bg-zinc-900/20">
          <p className="text-zinc-400 text-sm">0 listings available.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4" id="job-feed-list">
          {jobs.map(job => (
            <JobCard 
              key={job._id} 
              job={job} 
              onOpenDetails={(j) => setSelectedJob(j)} 
              onApplySuccess={fetchJobs}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
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
          theme="student"
          onApplySuccess={() => {
            fetchJobs();
          }}
        />
      )}
    </div>
  );
};

export default Feed;
