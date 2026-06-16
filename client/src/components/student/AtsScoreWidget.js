import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { Target, HelpCircle, Briefcase } from 'lucide-react';

const AtsScoreWidget = ({ resumeText }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [score, setScore] = useState(0);
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
      setScore(0);
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
        setScore(data.score || 0);
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

  const getGrade = (val) => {
    if (val >= 90) return 'A+';
    if (val >= 80) return 'A';
    if (val >= 70) return 'B+';
    if (val >= 60) return 'B';
    if (val >= 50) return 'C';
    return 'D';
  };

  // SVG parameters
  const radius = 35;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
        <div className="flex items-center gap-1.5">
          <Target className="text-primary-500" size={16} />
          <h3 className="text-xs font-semibold text-zinc-300">Live ATS Review Score</h3>
        </div>
        {loading && (
          <span className="text-[10px] text-zinc-500 animate-pulse font-mono">calculating...</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Animated Radial Progress */}
        <div className="relative flex items-center justify-center w-[85px] h-[85px]">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="42.5"
              cy="42.5"
              r={radius}
              className="stroke-zinc-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="42.5"
              cy="42.5"
              r={radius}
              className={`transition-all duration-500 ease-out ${getScoreColorClass(score)}`}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold font-mono leading-none text-zinc-100">{score}</span>
            <span className="text-[9px] text-zinc-500 font-medium">out of 100</span>
          </div>
        </div>

        {/* Dynamic Grade Tag & Match Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 border rounded ${getScoreColorBgClass(score)}`}>
              Grade: {getGrade(score)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {score >= 75 ? '🔥 Job Market Ready' : score >= 50 ? '📈 Needs Keywords' : '⚠️ Critical Review Needed'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-normal">
            {selectedJobId 
              ? 'This score reflects keyword overlap against your selected target job profile.'
              : 'Add your skills, experience, and projects to increase your general ATS readability score.'
            }
          </p>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">Select Target Placement Job</label>
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 appearance-none pr-8 cursor-pointer"
          >
            <option value="">General Review (No specific job)</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.company} — {job.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500 border-l border-zinc-800">
            <Briefcase size={12} />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-zinc-950 p-2.5 border border-zinc-850 rounded-lg flex gap-2 text-[9px] text-zinc-500">
        <HelpCircle size={14} className="shrink-0 text-zinc-600" />
        <p className="leading-relaxed">
          <strong>Tip:</strong> Matching resume bullet points directly with the keywords in a job description will improve your ranking in automated shortlisting models.
        </p>
      </div>
    </div>
  );
};

export default AtsScoreWidget;
