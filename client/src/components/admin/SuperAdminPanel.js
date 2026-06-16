import React from 'react';
import { Loader2, Check, Copy, Plus } from 'lucide-react';

const SuperAdminPanel = ({
  newCollege,
  setNewCollege,
  submittingCollege,
  generatedLink,
  copiedText,
  copyToClipboard,
  handleCreateCollege
}) => {
  return (
    <div className="space-y-6">
      {generatedLink && (
        <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 rounded space-y-3">
          <h3 className="text-sm font-semibold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Check size={16} /> Setup Link Generated
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Provide the following link to the college admin. They must use it to activate their account and configure a password.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text" 
              readOnly 
              value={generatedLink}
              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300 focus:outline-none"
            />
            <button 
              onClick={() => copyToClipboard(generatedLink, 'setup-link')}
              className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
              title="Copy setup link"
            >
              {copiedText === 'setup-link' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-300">Provision New College</h2>
        <form onSubmit={handleCreateCollege} className="border border-zinc-800 bg-zinc-900/20 p-5 rounded space-y-4">
          <div>
            <label htmlFor="college-name" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">College Name</label>
            <input 
              id="college-name"
              type="text" required
              value={newCollege.name}
              onChange={e => setNewCollege({ ...newCollege, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
              placeholder="e.g. Anurag University"
            />
          </div>
          <div>
            <label htmlFor="email-domain" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Email Domain</label>
            <input 
              id="email-domain"
              type="text" required
              value={newCollege.emailDomain}
              onChange={e => setNewCollege({ ...newCollege, emailDomain: e.target.value.replace(/@/g, '') })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="e.g. anurag.edu"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">Enter only the domain — <strong className="text-zinc-400">without @</strong> (e.g. <span className="font-mono">anu.edu</span> or <span className="font-mono">anu.ac.in</span>, not @anu.edu).</span>
          </div>
          <div>
            <label htmlFor="admin-name" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Admin Full Name</label>
            <input 
              id="admin-name"
              type="text" required
              value={newCollege.adminName}
              onChange={e => setNewCollege({ ...newCollege, adminName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
              placeholder="e.g. Dr. K. Prasanna"
            />
          </div>
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Admin Email</label>
            <input 
              id="admin-email"
              type="email" required
              value={newCollege.adminEmail}
              onChange={e => setNewCollege({ ...newCollege, adminEmail: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="e.g. kprasanna@anurag.edu.in"
            />
          </div>
          <div>
            <label htmlFor="licence-status" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Licence Tier</label>
            <select 
              id="licence-status"
              value={newCollege.licenceStatus}
              onChange={e => setNewCollege({ ...newCollege, licenceStatus: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 font-sans"
            >
              <option value="free">Free Tier (Limit 5 active jobs)</option>
              <option value="paid">Pro Tier (Unlimited & Analytics)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ai-review-quota" className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">AI Review Quota (Monthly)</label>
            <input 
              id="ai-review-quota"
              type="number" required min="1"
              value={newCollege.aiReviewQuota}
              onChange={e => setNewCollege({ ...newCollege, aiReviewQuota: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
              placeholder="e.g. 3"
            />
          </div>

          <button 
            type="submit" disabled={submittingCollege}
            className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submittingCollege ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Create College
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
