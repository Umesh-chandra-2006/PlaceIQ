import React from 'react';
import { CheckCircle } from 'lucide-react';

const renderSuggestionChecklist = (suggestion) => {
  if (!suggestion) return null;
  
  const items = suggestion
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .map(s => s.replace(/^[\s-•*]+/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 5);
    
  if (items.length === 0) {
    return <p className="text-sm text-zinc-400 leading-relaxed font-sans">{suggestion}</p>;
  }

  return (
    <ul className="space-y-2.5 mt-2 text-sm text-zinc-400 font-sans">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
          <CheckCircle size={14} className="text-primary-400 mt-1 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const AtsScorePanel = ({ aiResult }) => {
  if (!aiResult) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-5xl font-bold tracking-tighter text-zinc-100">
            {aiResult.score}
            <span className="text-2xl text-zinc-650 font-normal">/100</span>
          </div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-semibold">
            Match Score
          </div>
        </div>
        <div className={`text-6xl font-bold tracking-tighter ${['A', 'B'].includes(aiResult.grade) ? 'text-primary-400' : ['C'].includes(aiResult.grade) ? 'text-yellow-500' : 'text-red-500'}`}>
          {aiResult.grade}
        </div>
      </div>

      <div className="space-y-6">
        {aiResult.missingKeywords && aiResult.missingKeywords.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Missing Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {aiResult.missingKeywords.map((kw, i) => (
                <span key={i} className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs font-mono border border-red-500/20">{kw}</span>
              ))}
            </div>
          </div>
        )}
        {aiResult.matchedKeywords && aiResult.matchedKeywords.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Matched Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {aiResult.matchedKeywords.map((kw, i) => (
                <span key={i} className="bg-zinc-950 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono border border-zinc-800">{kw}</span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-zinc-955 p-4 rounded-lg border border-zinc-800 mt-6">
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-2 font-mono">AI Suggestion</h4>
          {renderSuggestionChecklist(aiResult.suggestion)}
        </div>
      </div>
    </div>
  );
};

export default AtsScorePanel;
export { renderSuggestionChecklist };
