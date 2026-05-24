/**
 * Coordinator Dashboard overview component.
 */
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';
import UpgradeBanner from '../shared/UpgradeBanner';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    activeJobs: 0,
    placementRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.subRole === 'coordinator_paid') {
          const { data } = await axios.get('/analytics/overview');
          setStats(data);
        } else {
          // Fallback for free tier
          const jobsRes = await axios.get('/jobs');
          setStats(prev => ({ ...prev, activeJobs: jobsRes.data.length }));
        }
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };
    fetchStats();
  }, [user.subRole]);

  const cards = [
    { title: 'Total Students', value: stats.totalStudents || '-', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Placed Students', value: stats.placedStudents || '-', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Placement Rate', value: `${stats.placementRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Placement Overview</h1>
      
      {user.subRole === 'coordinator_free' && <UpgradeBanner />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <p className="text-gray-500 text-sm italic">No recent activity to show.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            <p className="text-gray-500 text-sm italic">No upcoming deadlines.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
