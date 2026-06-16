import React from 'react';
import { X, Loader2, Plus } from 'lucide-react';

const ProvisionModal = ({
  isOpen,
  onClose,
  title,
  nameValue,
  setNameValue,
  emailValue,
  setEmailValue,
  submitting,
  onSubmit,
  placeholderName,
  placeholderEmail,
  description
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Full Name</label>
            <input
              type="text" required
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder={placeholderName}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Email Address</label>
            <input
              type="email" required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder={placeholderEmail}
            />
            {description && <span className="text-[10px] text-zinc-500 mt-1 block font-medium">{description}</span>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-xs font-semibold rounded text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Provision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvisionModal;
