import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Users, FileText } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    atRisk: [],
    atsDistribution: [],
    activity: [],
    branch: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, atRiskRes, atsRes, activityRes, branchRes] = await Promise.all([
        axios.get('/analytics/overview'),
        axios.get('/analytics/at-risk'),
        axios.get('/analytics/ats-distribution'),
        axios.get('/analytics/activity-heatmap'),
        axios.get('/analytics/branch')
      ]);

      setData({
        overview: overviewRes.data,
        atRisk: atRiskRes.data,
        atsDistribution: atsRes.data,
        activity: activityRes.data,
        branch: branchRes.data
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    let csvContent = "";
    
    // Overview Section
    csvContent += "PLACEMENT PERFORMANCE SUMMARY\n";
    csvContent += `Generated On,${new Date().toLocaleString()}\n`;
    csvContent += `Placement Rate,${data.overview?.placementRate ? data.overview.placementRate.toFixed(1) : '0.0'}%\n`;
    csvContent += `Total Active Students,${data.overview?.activeCount || 0}\n`;
    csvContent += `Students Placed,${data.overview?.placedStudents || 0}\n`;
    csvContent += `At-Risk Students Count,${data.atRisk.length || 0}\n\n`;
    
    // Branch Performance Section
    csvContent += "BRANCH-WISE PERFORMANCE\n";
    csvContent += "Branch,Total Students,Placed Students,Placement Rate (%)\n";
    branchChartData.forEach(b => {
      csvContent += `"${b.branch}",${b.Total},${b.Placed},${b['Placement Rate (%)']}\n`;
    });
    csvContent += "\n";
    
    // At-Risk Students Section
    csvContent += "FLAGGED AT-RISK STUDENTS\n";
    csvContent += "Student Name,Branch,CGPA,Active Backlogs,Applications Submitted,Risk Reason(s)\n";
    data.atRisk.forEach(student => {
      let riskFlags = [];
      if (student.cgpa < 6.5) riskFlags.push("Low CGPA");
      if (student.activeBacklogs > 0) riskFlags.push("Active Backlogs");
      if (student.applicationCount === 0) riskFlags.push("Zero Applications");
      csvContent += `"${student.name}","${student.branch}",${student.cgpa},${student.activeBacklogs},${student.applicationCount},"${riskFlags.join(' | ')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `placement_analytics_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8 h-[60vh] items-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  // Process User Composition Pie Chart Data
  const compositionData = [
    { name: 'Active Students', value: data.overview?.activeCount || 0 },
    { name: 'Deactivated', value: data.overview?.deactivatedCount || 0 }
  ];
  const PIE_COLORS = ['#6366f1', '#27272a']; // Indigo for active, zinc-800 for deactivated

  // Process ATS Distribution Bar Chart Data
  const atsBuckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  const atsChartData = atsBuckets.map((bucket, i) => {
    const boundaryStart = i * 20;
    const match = data.atsDistribution.find(d => d._id === boundaryStart) || { count: 0 };
    return { range: bucket, Applications: match.count };
  });

  // Process Application Activity over 30 Days (Area Chart)
  const activityMap = new Map();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    activityMap.set(d.toISOString().split('T')[0], 0);
  }
  data.activity.forEach(item => {
    activityMap.set(item._id, item.count);
  });
  const activityChartData = Array.from(activityMap.entries()).map(([date, count]) => ({
    date: date && !isNaN(new Date(date)) ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
    Applications: count
  }));

  // Process Branch Roster/Placement Data (Bar Chart)
  const branchChartData = data.branch.map(b => ({
    branch: b._id || 'Unknown',
    Total: b.total,
    Placed: b.placed,
    'Placement Rate (%)': b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0
  }));

  return (
    <div className="space-y-6 text-zinc-100 pb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-zinc-550 font-mono mt-0.5">Performance indices and flagged cohorts</p>
        </div>
        <button
          onClick={handleExportSummary}
          className="bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 shadow-md"
        >
          <FileText size={13} /> Export Summary (CSV)
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Placement Rate</span>
            <h3 className="text-2xl font-semibold font-mono text-primary-500 mt-1">
              {data.overview?.placementRate ? data.overview.placementRate.toFixed(1) : '0.0'}%
            </h3>
          </div>
          <div className="p-3 bg-primary-500/10 text-primary-500 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Total Active Students</span>
            <h3 className="text-2xl font-semibold font-mono text-zinc-100 mt-1">
              {data.overview?.activeCount || 0}
            </h3>
          </div>
          <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Students Placed</span>
            <h3 className="text-2xl font-semibold font-mono text-indigo-400 mt-1">
              {data.overview?.placedStudents || 0}
            </h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between shadow-lg border-red-500/20">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">At-Risk Students</span>
            <h3 className="text-2xl font-semibold font-mono text-red-400 mt-1">
              {data.atRisk.length}
            </h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Status Composition Donut */}
        <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col justify-between shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">Roster Distribution</span>
          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-zinc-200">
                {(data.overview?.activeCount || 0) + (data.overview?.deactivatedCount || 0)}
              </span>
              <span className="text-[9px] uppercase font-mono text-zinc-500 tracking-widest mt-0.5">Total Users</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2 font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              <span className="text-zinc-400">Active ({data.overview?.activeCount || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full" />
              <span className="text-zinc-500">Deactivated ({data.overview?.deactivatedCount || 0})</span>
            </div>
          </div>
        </div>

        {/* ATS score match distribution */}
        <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">ATS Match score Distribution</span>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
                <YAxis stroke="#71717a" fontSize={10} fontClassName="font-mono" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: '#27272a', opacity: 0.2 }}
                />
                <Bar dataKey="Applications" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-Day Activity Heatmap/Line Chart */}
        <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg lg:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">Application Activity (Last 30 Days)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
                <YAxis stroke="#71717a" fontSize={10} fontClassName="font-mono" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                />
                <Area type="monotone" dataKey="Applications" stroke="#10b981" fillOpacity={1} fill="url(#colorApps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch-wise Roster Performance */}
        <div className="border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col shadow-lg lg:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">Branch Performance & Placements</span>
          {branchChartData.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500 font-mono">0 branches tracked. Ensure cohorts are configured.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="branch" stroke="#71717a" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#71717a" fontSize={10} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', color: '#f4f4f5' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Bar dataKey="Total" fill="#3f3f46" name="Total Students" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Placed" fill="#6366f1" name="Placed Students" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Table */}
      <div className="border border-zinc-800 rounded overflow-hidden bg-zinc-950 shadow-lg">
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-widest font-mono">Action Required: At-Risk Students</span>
          <span className="text-xs font-mono text-zinc-500">{data.atRisk.length} records</span>
        </div>
        
        {data.atRisk.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm font-mono">
            0 at-risk students flagged.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-medium font-mono">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium text-right">CGPA</th>
                <th className="px-4 py-2 font-medium text-right">Backlogs</th>
                <th className="px-4 py-2 font-medium text-right">Applications</th>
                <th className="px-4 py-2 font-medium">Status Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono text-xs">
              {data.atRisk.map(student => {
                let risk = [];
                if (student.cgpa < 6.5) risk.push("CGPA");
                if (student.activeBacklogs > 0) risk.push("Backlogs");
                if (student.applicationCount === 0) risk.push("0 Apps");

                return (
                  <tr key={student._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-2 font-medium text-zinc-200">
                      {student.name}
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs uppercase tracking-wider">{student.branch}</td>
                    <td className={`px-4 py-2 text-right font-mono ${student.cgpa < 6.5 ? 'text-red-500' : 'text-zinc-300'}`}>{student.cgpa}</td>
                    <td className={`px-4 py-2 text-right font-mono ${student.activeBacklogs > 0 ? 'text-red-500' : 'text-zinc-300'}`}>{student.activeBacklogs}</td>
                    <td className={`px-4 py-2 text-right font-mono ${student.applicationCount === 0 ? 'text-red-500' : 'text-zinc-300'}`}>{student.applicationCount}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1.5">
                        {risk.map((r, i) => (
                          <span key={i} className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">{r}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
