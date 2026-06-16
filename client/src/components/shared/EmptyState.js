import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({
  icon: Icon = AlertCircle,
  title = "No data found",
  description = "There's nothing to display right now.",
  actionLabel,
  onActionClick,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-zinc-800/40 rounded-xl bg-zinc-900/10 max-w-md mx-auto space-y-4 font-sans ${className}`}>
      <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400">
        <Icon size={24} className="text-primary-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed font-sans">{description}</p>
      </div>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
export { EmptyState };
