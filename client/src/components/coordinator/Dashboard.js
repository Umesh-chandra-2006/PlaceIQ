import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    activeJobs: 0,
    placementRate: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const processJobsForDeadlines = (jobsList) => {
          const now = new Date();
          const upcoming = jobsList
            .filter(j => j.status === 'active' && new Date(j.deadline) > now)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 2);
          setUpcomingDeadlines(upcoming);
        };

        const jobsRes = await axios.get('/jobs');
        const activeJobsCount = jobsRes.data.filter(j => j.status === 'active').length;

        try {
          const { data } = await axios.get('/analytics/overview');
          setStats({
            ...data,
            activeJobs: activeJobsCount
          });
        } catch (err) {
          console.error("Error fetching overview analytics:", err);
          setStats(prev => ({ 
            ...prev, 
            activeJobs: activeJobsCount
          }));
        }
        processJobsForDeadlines(jobsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };
    fetchStats();
  }, [user.subRole]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded overflow-hidden">
        <div className="bg-zinc-950 p-4 flex flex-col justify-between h-24">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Active Jobs</span>
          <span className="text-3xl font-mono text-zinc-100">{stats.activeJobs}</span>
        </div>
        <div className="bg-zinc-950 p-4 flex flex-col justify-between h-24">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Students</span>
          <span className="text-3xl font-mono text-zinc-100">{stats.totalStudents || '-'}</span>
        </div>
        <div className="bg-zinc-950 p-4 flex flex-col justify-between h-24">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Placed</span>
          <span className="text-3xl font-mono text-primary-500">{stats.placedStudents || '-'}</span>
        </div>
        <div className="bg-zinc-950 p-4 flex flex-col justify-between h-24">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Placement Rate</span>
          <span className="text-3xl font-mono text-zinc-100">{stats.placementRate ? stats.placementRate.toFixed(1) : '-'}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Needs Attention Panel */}
        <div className="border border-zinc-800 rounded bg-zinc-950 flex flex-col">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <AlertCircle size={14} className="text-primary-500" />
            <span className="text-xs font-medium text-zinc-300">Needs Attention</span>
          </div>
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-400">Unplaced Students</span>
              <span className="font-mono text-sm text-zinc-200">{(stats.totalStudents || 0) - (stats.placedStudents || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-400">Pending Approvals</span>
              <span className="font-mono text-sm text-zinc-200">0</span>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines Panel */}
        <div className="border border-zinc-800 rounded bg-zinc-950 flex flex-col">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <Clock size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Upcoming Deadlines</span>
          </div>
          <div className="p-4 flex-1">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-sm text-zinc-500 text-center py-4">No upcoming deadlines</div>
            ) : (
              upcomingDeadlines.map((job, idx) => {
                const isLast = idx === upcomingDeadlines.length - 1;
                const msLeft = new Date(job.deadline) - new Date();
                const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                const colorClass = daysLeft <= 2 ? "text-red-500" : "text-yellow-500";
                const daysLeftStr = daysLeft === 0 ? "Today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
                return (
                  <div key={job._id} className={`flex items-center justify-between py-2 ${!isLast ? 'border-b border-zinc-800/50' : ''}`}>
                    <span className="text-sm text-zinc-400">{job.title} ({job.company})</span>
                    <span className={`font-mono text-sm ${colorClass}`}>{daysLeftStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
