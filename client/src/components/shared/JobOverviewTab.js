import React from 'react';
import { MapPin, DollarSign, Calendar, Shield, Clock } from 'lucide-react';

const renderBulletPoints = (text, bulletDotClass = "text-primary-500", bulletTextClass = "text-zinc-300") => {
  if (!text || text === 'N/A') return null;
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-2">
      {lines.map((line, idx) => {
        const cleanedLine = line.replace(/^[\u2022\-*#\d+.\s]+/, '').trim();
        return (
          <li key={idx} className={`text-sm flex items-start gap-2.5 leading-relaxed ${bulletTextClass}`}>
            <span className={`mt-1 font-bold ${bulletDotClass}`}>•</span>
            <span>{cleanedLine}</span>
          </li>
        );
      })}
    </ul>
  );
};

const JobOverviewTab = ({ job, theme = "student" }) => {
  const styles = {
    student: {
      cardBg: "bg-zinc-900/30 border border-zinc-800",
      bulletText: "text-zinc-300",
      bulletDot: "text-primary-500",
      sectionHeader: "text-zinc-200 font-medium font-mono uppercase tracking-wider text-xs",
      label: "text-zinc-555 font-mono uppercase text-[10px]",
      value: "text-zinc-300 font-mono text-sm",
    },
    coordinator: {
      cardBg: "bg-zinc-900/30 border border-zinc-800",
      bulletText: "text-zinc-300",
      bulletDot: "text-primary-500",
      sectionHeader: "text-zinc-200 font-medium font-mono uppercase tracking-wider text-xs",
      label: "text-zinc-555 font-mono uppercase text-[10px]",
      value: "text-zinc-300 font-mono text-sm",
    }
  }[theme] || {
    cardBg: "bg-zinc-900/30 border border-zinc-800",
    bulletText: "text-zinc-300",
    bulletDot: "text-primary-500",
    sectionHeader: "text-zinc-200 font-medium font-mono uppercase tracking-wider text-xs",
    label: "text-zinc-555 font-mono uppercase text-[10px]",
    value: "text-zinc-300 font-mono text-sm",
  };

  const content = (job.rolesAndResponsibilities && job.rolesAndResponsibilities !== 'N/A')
    ? job.rolesAndResponsibilities
    : (job.description && job.description !== 'No description found.' && job.description !== 'N/A')
    ? job.description
    : null;

  return (
    <div className="space-y-7">
      {/* Metadata Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
          <MapPin size={15} className="text-zinc-400 mb-1" />
          <span className={styles.label}>Location</span>
          <span className="text-xs font-semibold mt-0.5 truncate max-w-full">{job.location || 'N/A'}</span>
        </div>
        <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
          <DollarSign size={15} className="text-zinc-400 mb-1" />
          <span className={styles.label}>Stipend</span>
          <span className="text-xs font-semibold mt-0.5 font-mono truncate max-w-full">{job.stipend || job.ctc || 'N/A'}</span>
        </div>
        <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
          <Calendar size={15} className="text-zinc-400 mb-1" />
          <span className={styles.label}>Deadline</span>
          <span className="text-xs font-semibold mt-0.5 font-mono truncate max-w-full">
            {job.deadline && !isNaN(new Date(job.deadline))
              ? new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Work Mode / Duration Details */}
      {(job.workMode && job.workMode !== 'N/A') || job.duration ? (
        <div className="grid grid-cols-2 gap-3">
          {job.workMode && job.workMode !== 'N/A' && (
            <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
              <Shield size={15} className="text-zinc-400 mb-1" />
              <span className={styles.label}>Work Mode</span>
              <span className="text-xs font-semibold mt-0.5 capitalize">
                {job.workMode === 'inoffice' ? '🏢 In Office' : job.workMode === 'remote' ? '🏠 Remote' : '🔀 Hybrid'}
              </span>
            </div>
          )}
          {job.duration && (
            <div className={`p-3 rounded-md ${styles.cardBg} flex flex-col items-center justify-center text-center`}>
              <Clock size={15} className="text-zinc-400 mb-1" />
              <span className={styles.label}>Duration</span>
              <span className="text-xs font-semibold mt-0.5">{job.duration}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Roles & Responsibilities */}
      {content && (
        <div className="space-y-2">
          <h3 className={styles.sectionHeader}>Roles &amp; Responsibilities</h3>
          {renderBulletPoints(content, styles.bulletDot, styles.bulletText)}
        </div>
      )}

      {/* Requirements */}
      {job.requirements && job.requirements !== 'N/A' && (
        <div className="space-y-2">
          <h3 className={styles.sectionHeader}>Requirements &amp; Skills</h3>
          {renderBulletPoints(job.requirements, styles.bulletDot, styles.bulletText)}
        </div>
      )}

      {/* Eligibility Criteria */}
      {job.eligibility && (
        <div className="space-y-4">
          <h3 className={styles.sectionHeader}>Eligibility Criteria</h3>
          {job.eligibility.description && job.eligibility.description !== 'N/A' && (
            <p className={`text-sm leading-relaxed italic ${styles.bulletText}`}>{job.eligibility.description}</p>
          )}
          <div className={`grid grid-cols-2 gap-3 p-4 rounded-lg ${styles.cardBg}`}>
            {[
              ['Experience',         job.eligibility.experience],
              ['Min CGPA',           job.eligibility.minCgpa],
              ['Max Backlogs',       typeof job.eligibility.maxBacklogs === 'number' ? `${job.eligibility.maxBacklogs} allowed` : null],
              ['Max Active Backlogs',typeof job.eligibility.maxActiveBacklogs === 'number' ? job.eligibility.maxActiveBacklogs : null],
              ['Min 10th %',         typeof job.eligibility.minTenthPercent === 'number' && job.eligibility.minTenthPercent > 0 ? job.eligibility.minTenthPercent : null],
              ['Min 12th %',         typeof job.eligibility.minTwelfthPercent === 'number' && job.eligibility.minTwelfthPercent > 0 ? job.eligibility.minTwelfthPercent : null],
              ['Target Batch Years', job.eligibility.batchYears?.length ? job.eligibility.batchYears.join(', ') : null],
            ].filter(([label, v], i, arr) => {
              const firstIdx = arr.findIndex(([l]) => l === label);
              if (firstIdx !== i) return false;
              return v !== null && v !== undefined && v !== 'N/A' && v !== '';
            }).map(([label, value]) => (
              <div key={label}>
                <span className={`block text-[10px] uppercase tracking-wider ${styles.label}`}>{label}</span>
                <span className={styles.value}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobOverviewTab;
