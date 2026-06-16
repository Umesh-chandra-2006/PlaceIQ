import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { Target, HelpCircle, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';

const AtsScoreWidget = ({ resumeText }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [atsData, setAtsData] = useState({
    score: 0,
    grade: 'D',
    breakdown: { keywords: 0, formatting: 0, experience: 0, projects: 0, education: 0 },
    matchedKeywords: [],
    missingKeywords: [],
    healthInsights: []
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  // Fetch active college jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get('/jobs?limit=100');
        setJobs(data.data || []);
      } catch (err) {
        console.error("Failed to load jobs list in ATS score widget:", err);
      }
    };
    fetchJobs();
  }, []);

  // Calculate ATS Score with debounce
  useEffect(() => {
    if (!resumeText) {
      setAtsData({
        score: 0,
        grade: 'D',
        breakdown: { keywords: 0, formatting: 0, experience: 0, projects: 0, education: 0 },
        matchedKeywords: [],
        missingKeywords: [],
        healthInsights: []
      });
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.post('/students/resume/ats-score', {
          resumeText,
          jobId: selectedJobId || undefined
        });
        setAtsData({
          score: data.score || 0,
          grade: data.grade || 'D',
          breakdown: data.breakdown || { keywords: 0, formatting: 0, experience: 0, projects: 0, education: 0 },
          matchedKeywords: data.matchedKeywords || [],
          missingKeywords: data.missingKeywords || [],
          healthInsights: data.healthInsights || []
        });
      } catch (err) {
        console.error("Failed to calculate ATS score:", err);
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [resumeText, selectedJobId]);

  // Smooth counter animation for overall score
  useEffect(() => {
    const target = atsData.score;
    if (displayScore === target) return;

    const interval = setTimeout(() => {
      if (displayScore < target) {
        setDisplayScore(prev => Math.min(prev + 1, target));
      } else {
        setDisplayScore(prev => Math.max(prev - 1, target));
      }
    }, 12);

    return () => clearTimeout(interval);
  }, [atsData.score, displayScore]);

  // Color mappings
  const getScoreColorClass = (val) => {
    if (val < 50) return 'text-red-500 stroke-red-500';
    if (val < 75) return 'text-amber-500 stroke-amber-500';
    return 'text-emerald-500 stroke-emerald-500';
  };

  const getScoreColorBgClass = (val) => {
    if (val < 50) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (val < 75) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  // SVG parameters
  const radius = 35;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="bg-zinc-900/40 p-5 border border-zinc-800 rounded-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Target className="text-primary-500" size={16} />
          <h3 className="text-xs font-semibold text-zinc-300">ATS Optimization Analysis</h3>
        </div>
        {loading && (
          <span className="text-[10px] text-zinc-500 animate-pulse font-mono">re-indexing...</span>
        )}
      </div>

      {/* Hero Score Ring */}
      <div className="flex items-center gap-5 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
        <div className="relative flex items-center justify-center w-[85px] h-[85px] shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="42.5"
              cy="42.5"
              r={radius}
              className="stroke-zinc-850"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="42.5"
              cy="42.5"
              r={radius}
              className={`transition-all duration-300 ease-out ${getScoreColorClass(atsData.score)}`}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold font-mono leading-none text-zinc-100">{displayScore}%</span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">ATS Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 border rounded-md ${getScoreColorBgClass(atsData.score)}`}>
              Grade: {atsData.grade}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 border rounded-md ${getScoreColorBgClass(atsData.score)}`}>
              {atsData.score >= 75 ? '🔥 Target Match' : atsData.score >= 50 ? '⚠️ Improve Keywords' : '❌ Critical Review'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            {selectedJobId 
              ? 'Real-time keyword check against the active placement description details.'
              : 'Add your skills, experience, and projects to increase your general ATS readability score.'
            }
          </p>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">Target Placement Listing</label>
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 appearance-none pr-8 cursor-pointer"
          >
            <option value="">General ATS Checklist (No job)</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.company} — {job.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500 border-l border-zinc-850">
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Sub-Metrics Breakdown Grid */}
      <div className="space-y-2 pt-1">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Metric Breakdown</h4>
        <div className="space-y-2 bg-zinc-955/20 p-3.5 border border-zinc-850 rounded-xl">
          {Object.entries(atsData.breakdown).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 capitalize">
                <span className="font-medium">{key}</span>
                <span className="font-mono">{val}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    val < 50 ? 'bg-red-500' : val < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords Check */}
      {atsData.missingKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Missing Target Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {atsData.missingKeywords.slice(0, 6).map((kw, idx) => (
              <span key={idx} className="text-[9px] font-mono bg-red-500/5 text-red-400 border border-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>✕</span> {kw}
              </span>
            ))}
            {atsData.matchedKeywords.slice(0, 4).map((kw, idx) => (
              <span key={idx} className="text-[9px] font-mono bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>✓</span> {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Health Insights */}
      {atsData.healthInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Resume Health Insights</h4>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
            {atsData.healthInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-2 p-2 bg-zinc-950/30 border border-zinc-855 rounded-lg text-[10px]">
                {insight.type === 'warning' ? (
                  <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                )}
                <span className="text-zinc-400 leading-normal">{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Help Tip */}
      <div className="bg-zinc-950/20 p-3 border border-zinc-850 rounded-lg flex gap-2 text-[9px] text-zinc-500">
        <HelpCircle size={14} className="shrink-0 text-zinc-600 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Protip:</strong> ATS systems rate resumes by scanning keyword proximity, structure, and action verbs. Make sure to describe project features with metrics (e.g. <em>"optimized lookup speed by 30%"</em>).
        </p>
      </div>
    </div>
  );
};

export default AtsScoreWidget;
