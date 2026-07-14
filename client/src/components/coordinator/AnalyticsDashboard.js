import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { Loader2, Filter, Calendar, AlertTriangle, FileText } from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';

// Import analytics components
import SummaryStatsRow from './analytics/SummaryStatsRow';
import PlacementFunnelChart from './analytics/PlacementFunnelChart';
import DepartmentBreakdownChart from './analytics/DepartmentBreakdownChart';
import CGPADistributionChart from './analytics/CGPADistributionChart';
import TopCompaniesList from './analytics/TopCompaniesList';
import PlacementTrendChart from './analytics/PlacementTrendChart';
import ApplicationsPerStudentChart from './analytics/ApplicationsPerStudentChart';
import InsightBanner from './analytics/InsightBanner';

import {
  getSummary,
  getFunnel,
  getByDepartment,
  getCgpaDistribution,
  getTopCompanies,
  getTrend,
  getApplicationsPerStudent
} from '../../api/analytics';

const AnalyticsDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Analytics states
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [cgpaData, setCgpaData] = useState(null);
  const [companiesData, setCompaniesData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [distData, setDistData] = useState(null);

  // Sync state with URL params
  const cohortId = searchParams.get('cohortId') || 'all';
  const department = searchParams.get('department') || 'all';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  // Fetch filter choices (cohorts and departments)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data } = await axios.get('/batches?limit=1000');
        const batchList = data && data.data ? data.data : (Array.isArray(data) ? data : []);
        setBatches(batchList);

        // Collect distinct departments/branches
        const distinctDepts = [...new Set(batchList.map(b => b.branch).filter(Boolean))];
        setDepartments(distinctDepts);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch all analytics datasets
  const fetchAnalyticsData = useCallback(async () => {
    setLoadingData(true);
    const params = {};
    if (cohortId !== 'all') params.cohortId = cohortId;
    if (department !== 'all') params.department = department;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    try {
      const [
        summaryRes,
        funnelRes,
        deptRes,
        cgpaRes,
        companiesRes,
        trendRes,
        distRes
      ] = await Promise.allSettled([
        getSummary(params),
        getFunnel(params),
        getByDepartment(params),
        getCgpaDistribution(params),
        getTopCompanies(params),
        getTrend(params),
        getApplicationsPerStudent(params)
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value);
      if (deptRes.status === 'fulfilled') setDeptData(deptRes.value);
      if (cgpaRes.status === 'fulfilled') setCgpaData(cgpaRes.value);
      if (companiesRes.status === 'fulfilled') setCompaniesData(companiesRes.value);
      if (trendRes.status === 'fulfilled') setTrendData(trendRes.value);
      if (distRes.status === 'fulfilled') setDistData(distRes.value);
    } catch (error) {
      console.error('Error loading analytics datasets:', error);
    } finally {
      setLoadingData(false);
    }
  }, [cohortId, department, dateFrom, dateTo]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Update URL params helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleExportSummary = () => {
    if (!summary) return;
    let csvContent = "PLACEMENT PERFORMANCE SUMMARY\n";
    csvContent += `Generated On,${new Date().toLocaleString()}\n`;
    csvContent += `Total Students,${summary.totalStudents || 0}\n`;
    csvContent += `Placed Students,${summary.placedStudents || 0}\n`;
    csvContent += `Placement Rate,${summary.placementRate || 0}%\n`;
    csvContent += `Average CTC,${summary.avgCTC || 0} LPA\n`;
    csvContent += `Highest CTC,${summary.highestCTC || 0} LPA\n`;
    csvContent += `Active Hiring Partners,${summary.activeCompanies || 0}\n`;
    csvContent += `Total Offers Generated,${summary.totalOffers || 0}\n\n`;

    if (deptData?.departments) {
      csvContent += "DEPARTMENT PERFORMANCE BREAKDOWN\n";
      csvContent += "Department,Total Candidates,Placed Count,Placement Rate (%)\n";
      deptData.departments.forEach(d => {
        csvContent += `"${d.department}",${d.totalStudents},${d.placed},${d.placementRate}\n`;
      });
      csvContent += "\n";
    }

    if (companiesData?.companies) {
      csvContent += "TOP RECRUITING PARTNERS\n";
      csvContent += "Company Name,Offers Count,Average CTC (LPA)\n";
      companiesData.companies.forEach(c => {
        csvContent += `"${c.company}",${c.offersCount},${c.avgCTC}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `placement_analytics_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingFilters) {
    return (
      <div className="flex justify-center p-8 h-[60vh] items-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  // Check if college has zero applications or students
  const isCollegeEmpty = !loadingData && summary && (summary.totalStudents === 0 || (funnel?.stages && funnel.stages.every(s => s.count === 0)));

  return (
    <div className="space-y-6 text-zinc-100 pb-12 font-sans selection:bg-primary-500/20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Placement Performance Analytics</h1>
          <p className="text-xs text-zinc-550 font-mono mt-0.5">Automated cohort indexing and drop-off analysis</p>
        </div>
        
        {summary && (
          <button
            onClick={handleExportSummary}
            className="bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 shadow-md self-stretch md:self-auto justify-center"
          >
            <FileText size={13} /> Export Report (CSV)
          </button>
        )}
      </div>

      {/* Thin Filters Bar */}
      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono mr-2">
            <Filter size={13} className="text-primary-500" />
            <span>Filters:</span>
          </div>

          {/* Cohort/Batch Selector */}
          <select
            value={cohortId}
            onChange={(e) => updateFilter('cohortId', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none hover:border-zinc-700 transition-colors font-mono"
          >
            <option value="all">All Cohorts (Batches)</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          {/* Department/Branch Selector */}
          <select
            value={department}
            onChange={(e) => updateFilter('department', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none hover:border-zinc-700 transition-colors font-mono"
          >
            <option value="all">All Departments</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 border-t border-zinc-850/60 lg:border-t-0 pt-2.5 lg:pt-0">
          <Calendar size={13} className="text-zinc-550 mr-1" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none hover:border-zinc-700 transition-colors font-mono"
          />
          <span className="text-zinc-650 text-xs font-mono">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none hover:border-zinc-700 transition-colors font-mono"
          />
        </div>
      </div>

      {isCollegeEmpty ? (
        /* Unified Empty State Screen */
        <div className="min-h-[45vh] flex flex-col items-center justify-center border border-zinc-800 rounded-lg bg-zinc-950 p-8 text-center max-w-lg mx-auto shadow-2xl animate-fadeIn">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-sm font-bold text-zinc-200 mb-2 font-mono uppercase tracking-widest">No Placement Data</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            No placement data yet — analytics will populate once students start applying.
          </p>
        </div>
      ) : (
        /* Analytics Grid Workspace */
        <div className="space-y-6">
          
          {/* Summary Row */}
          <ErrorBoundary>
            <SummaryStatsRow summary={summary} loading={loadingData} />
          </ErrorBoundary>

          {/* Insight Alert Callout */}
          <ErrorBoundary>
            <InsightBanner summary={summary} departmentsData={deptData} funnel={funnel} />
          </ErrorBoundary>

          {/* Hero Chart & CGPA Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ErrorBoundary>
                <PlacementFunnelChart funnel={funnel} loading={loadingData} />
              </ErrorBoundary>
            </div>
            <div>
              <ErrorBoundary>
                <CGPADistributionChart cgpaData={cgpaData} loading={loadingData} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Tier 3 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ErrorBoundary>
              <DepartmentBreakdownChart departmentsData={deptData} loading={loadingData} />
            </ErrorBoundary>
            <ErrorBoundary>
              <TopCompaniesList companiesData={companiesData} loading={loadingData} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ApplicationsPerStudentChart distData={distData} loading={loadingData} />
            </ErrorBoundary>
          </div>

          {/* Optional Trend Chart */}
          {trendData && trendData.points && trendData.points.length >= 3 && (
            <ErrorBoundary>
              <PlacementTrendChart trendData={trendData} loading={loadingData} />
            </ErrorBoundary>
          )}

        </div>
      )}

    </div>
  );
};

export default AnalyticsDashboard;
