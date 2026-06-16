import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 24, className = '', label = 'Loading...' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-4 text-zinc-400 ${className}`}>
      <Loader2 size={size} className="animate-spin text-primary-500" />
      {label && <span className="text-xs font-mono tracking-wider">{label}</span>}
    </div>
  );
};

export default Spinner;
export { Spinner };
