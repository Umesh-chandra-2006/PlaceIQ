import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { BarChart3, AlertTriangle, TrendingUp, Users, Target, Activity, Loader2 } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    atRisk: [],
    atsDistribution: [],
    activity: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, atRiskRes, atsRes, activityRes] = await Promise.all([
        axios.get('/analytics/overview'),
        axios.get('/analytics/at-risk'),
        axios.get('/analytics/ats-distribution'),
        axios.get('/analytics/activity-heatmap')
      ]);

      setData({
        overview: overviewRes.data,
        atRisk: atRiskRes.data,
        atsDistribution: atsRes.data,
        activity: activityRes.data
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

  // Process ATS Distribution for Chart
  const atsBuckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  let maxAtsCount = 1;
  const atsCounts = atsBuckets.map((bucket, i) => {
    const boundaryStart = i * 20;
    const match = data.atsDistribution.find(d => d._id === boundaryStart) || { count: 0 };
    if (match.count > maxAtsCount) maxAtsCount = match.count;
    return match.count;
  });

  // Process Activity Heatmap for Chart
  let maxActivity = 1;
  const activityMap = new Map();
  // Fill past 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    activityMap.set(d.toISOString().split('T')[0], 0);
  }
  data.activity.forEach(item => {
    activityMap.set(item._id, item.count);
    if (item.count > maxActivity) maxActivity = item.count;
  });
  const activityBars = Array.from(activityMap.entries());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={28}/> Advanced Analytics</h1>
        <p className="text-gray-500">Placement insights and pipeline metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium text-sm flex items-center gap-2"><Users size={16}/> Total Students</div>
          <div className="text-3xl font-black text-gray-800 mt-2">{data.overview?.totalStudents || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium text-sm flex items-center gap-2"><Target size={16}/> Placed Students</div>
          <div className="text-3xl font-black text-primary-600 mt-2">{data.overview?.placedStudents || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium text-sm flex items-center gap-2"><TrendingUp size={16}/> Placement Rate</div>
          <div className="text-3xl font-black text-green-600 mt-2">{data.overview?.placementRate?.toFixed(1) || 0}%</div>
        </div>
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between">
          <div className="text-red-700 font-medium text-sm flex items-center gap-2"><AlertTriangle size={16}/> At-Risk Students</div>
          <div className="text-3xl font-black text-red-600 mt-2">{data.atRisk?.length || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ATS Distribution Chart (CSS-based) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6"><Target size={20}/> ATS Match Distribution</h2>
          <p className="text-xs text-gray-500 mb-6">How well are student resumes matching job descriptions across all applications?</p>
          <div className="flex items-end justify-around h-48 border-b border-gray-200 pb-2 relative">
            {atsCounts.map((count, i) => (
              <div key={i} className="flex flex-col items-center w-1/6 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs py-1 px-2 rounded mb-2 absolute" style={{ bottom: `${(count / maxAtsCount) * 100}%` }}>{count}</div>
                <div 
                  className="w-full bg-primary-500 rounded-t-md hover:bg-primary-600 transition-all" 
                  style={{ height: `${(count / maxAtsCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                ></div>
                <div className="text-xs text-gray-500 mt-2 font-medium">{atsBuckets[i]}</div>
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-gray-400 mt-2">ATS Score Range (%)</div>
        </div>

        {/* Activity Heatmap (CSS-based) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6"><Activity size={20}/> Application Activity (Last 30 Days)</h2>
          <p className="text-xs text-gray-500 mb-6">Daily application volume tracking</p>
          <div className="flex items-end justify-between h-48 border-b border-gray-200 pb-2">
            {activityBars.map(([date, count], i) => (
              <div key={date} className="w-1.5 md:w-2 mx-0.5 group relative flex flex-col justify-end h-full">
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                  {date}: {count}
                </div>
                <div 
                  className={`w-full rounded-t-sm transition-all ${count > 0 ? 'bg-indigo-500' : 'bg-gray-100'}`} 
                  style={{ height: count > 0 ? `${(count / maxActivity) * 100}%` : '2px', minHeight: count > 0 ? '4px' : '2px' }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* At-Risk Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-red-500"/> At-Risk Students Action List</h2>
        <p className="text-sm text-gray-500 mb-4">Students flagged with high active backlogs, low CGPA (&lt;6.5), or 0 applications submitted.</p>
        
        {data.atRisk.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
            No at-risk students found! 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Student Name</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">Backlogs</th>
                  <th className="px-4 py-3">Applications</th>
                  <th className="px-4 py-3 rounded-tr-lg">Risk Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.atRisk.map(student => {
                  let risk = [];
                  if (student.cgpa < 6.5) risk.push("Low CGPA");
                  if (student.activeBacklogs > 0) risk.push("Backlogs");
                  if (student.applicationCount === 0) risk.push("0 Applications");

                  return (
                    <tr key={student._id} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {student.name}
                        <div className="text-xs text-gray-400 font-normal">{student.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student.branch}</td>
                      <td className={`px-4 py-3 font-bold ${student.cgpa < 6.5 ? 'text-red-600' : 'text-gray-700'}`}>{student.cgpa}</td>
                      <td className={`px-4 py-3 font-bold ${student.activeBacklogs > 0 ? 'text-red-600' : 'text-gray-700'}`}>{student.activeBacklogs}</td>
                      <td className={`px-4 py-3 font-bold ${student.applicationCount === 0 ? 'text-red-600' : 'text-gray-700'}`}>{student.applicationCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {risk.map((r, i) => (
                            <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">{r}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
