import React from 'react';
import { Lightbulb } from 'lucide-react';

const InsightBanner = ({ summary, departmentsData, funnel }) => {
  if (!summary || !funnel) return null;

  const { placementRate = 0 } = summary;
  const departments = departmentsData?.departments || [];
  const stages = funnel?.stages || [];

  let insight = "";

  // 1. Department threshold check
  if (departments.length > 0) {
    const lowestDept = departments[departments.length - 1]; // sorted descending, so last is lowest
    const diff = placementRate - lowestDept.placementRate;
    if (diff > 15) {
      insight = `Department ${lowestDept.department} has the lowest placement rate at ${lowestDept.placementRate.toFixed(1)}%, which is ${diff.toFixed(1)} percentage points below the cohort average.`;
    }
  }

  // 2. Conversion drop check if department check didn't flag
  if (!insight && stages.length >= 4) {
    const interview = stages.find(s => s.stage === "Interview")?.count || 0;
    const offer = stages.find(s => s.stage === "Offer")?.count || 0;
    if (interview > 0) {
      const conversion = (offer / interview) * 100;
      if (conversion < 35) {
        insight = `Interview-to-offer conversion is low this season (${conversion.toFixed(1)}%). Consider scheduling mock interview support or soft skill training drives.`;
      }
    }
  }

  // 3. Fallback generic insight if no thresholds crossed
  if (!insight) {
    insight = `Placement activity is stable. Monitor disengaged students (those with 0 applications submitted) to boost overall campaign participation.`;
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 px-4 flex items-center gap-3 text-xs shadow-md">
      <div className="p-1.5 bg-primary-500/10 text-primary-400 rounded-md shrink-0">
        <Lightbulb size={14} />
      </div>
      <div className="leading-relaxed text-zinc-300 font-sans">
        <strong className="text-zinc-200 font-semibold font-mono uppercase tracking-wider text-[10px] mr-1.5">Auto-Generated Insight:</strong>
        {insight}
      </div>
    </div>
  );
};

export default InsightBanner;
