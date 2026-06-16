import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, limit, total, onPageChange, onLimitChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 bg-zinc-950 font-sans text-xs">
      <div className="text-zinc-500 font-mono">
        Showing {Math.min(total, (page - 1) * limit + 1)}–{Math.min(total, page * limit)} of {total} records
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Rows per page:</span>
          <select 
            value={limit} 
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-zinc-700"
          >
            {[10, 20, 50, 100].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button 
            disabled={page === 1} 
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-zinc-300 font-mono px-2">Page {page} of {pages}</span>
          <button 
            disabled={page === pages} 
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
