import React from 'react';
import { Loader2, Check, Trash2, MoreVertical } from 'lucide-react';
import axios from '../../api/axios';

const CollegesTable = ({
  colleges,
  loadingColleges,
  activeDropdown,
  setActiveDropdown,
  copyToClipboard,
  copiedText,
  fetchColleges,
  handleUpdateLicence,
  handleDeleteCollege,
  setGeneratedLink
}) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-300">Registered Colleges</h2>
        {loadingColleges && <Loader2 className="animate-spin text-zinc-500" size={16} />}
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-900/10 relative">
        <div className="overflow-x-auto min-h-[280px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">College Name</th>
                <th className="px-4 py-3">Email Domain</th>
                <th className="px-4 py-3">Licence / Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {colleges.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">
                    No colleges registered.
                  </td>
                </tr>
              ) : (
                colleges.map((col) => (
                  <tr key={col._id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-200">{col.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{col._id}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">@{col.emailDomain}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                          col.licenceStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          col.licenceStatus === 'expired' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {col.licenceStatus}
                        </span>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400">
                          AI: {col.aiReviewQuota ?? 3}/mo
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          col.isActive !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-550/20'
                        }`}>
                          {col.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative flex justify-end">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === col._id ? null : col._id)}
                          className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shadow-lg hover:bg-zinc-850"
                          title="Actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {activeDropdown === col._id && (
                          <div className="absolute right-0 mt-8 w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl z-30 py-1 text-left font-sans text-xs animate-fadeIn select-none">
                            {!col.isAdminSetup && (
                              <>
                                <button 
                                  onClick={() => {
                                    const link = `${window.location.origin}/setup-account?email=${encodeURIComponent(col.adminEmail)}&token=${col.adminSetupToken}`;
                                    copyToClipboard(link, `copy-setup-${col._id}`);
                                    alert("Admin setup link copied to clipboard!");
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100 flex items-center gap-1.5 font-medium transition-colors"
                                >
                                  Copy Admin Link
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (window.confirm("Regenerate a fresh setup link? The old setup link will expire.")) {
                                      try {
                                        const { data } = await axios.post(`/admin/colleges/${col._id}/regenerate-setup`);
                                        setGeneratedLink(data.setupLink);
                                        alert("Fresh setup link generated successfully! You can copy it from the setup alert card.");
                                        fetchColleges();
                                        setActiveDropdown(null);
                                      } catch (e) {
                                        alert(e.response?.data?.error || "Failed to regenerate setup link.");
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-zinc-355 hover:bg-zinc-900 hover:text-zinc-100 flex items-center gap-1.5 font-medium transition-colors"
                                >
                                  Regenerate Setup Link
                                </button>
                                <hr className="border-zinc-800 my-1" />
                              </>
                            )}
                            <button 
                              onClick={() => { handleUpdateLicence(col._id, 'paid'); setActiveDropdown(null); }}
                              className={`w-full px-3 py-2 flex items-center justify-between transition-colors ${col.licenceStatus === 'paid' ? 'text-emerald-400 font-bold bg-emerald-500/5' : 'text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100'}`}
                            >
                              <span>License: PRO</span>
                              {col.licenceStatus === 'paid' && <Check size={10} />}
                            </button>
                            <button 
                              onClick={() => { handleUpdateLicence(col._id, 'free'); setActiveDropdown(null); }}
                              className={`w-full px-3 py-2 flex items-center justify-between transition-colors ${col.licenceStatus === 'free' ? 'text-amber-400 font-bold bg-amber-500/5' : 'text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100'}`}
                            >
                              <span>License: FREE</span>
                              {col.licenceStatus === 'free' && <Check size={10} />}
                            </button>
                            <button 
                              onClick={() => { handleUpdateLicence(col._id, 'expired'); setActiveDropdown(null); }}
                              className={`w-full px-3 py-2 flex items-center justify-between transition-colors ${col.licenceStatus === 'expired' ? 'text-red-400 font-bold bg-red-500/5' : 'text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100'}`}
                            >
                              <span>License: EXPIRED</span>
                              {col.licenceStatus === 'expired' && <Check size={10} />}
                            </button>
                            <button 
                              onClick={async () => {
                                const newQuota = prompt(`Configure monthly AI review quota for ${col.name}:`, col.aiReviewQuota || 3);
                                if (newQuota !== null) {
                                  const quotaNum = parseInt(newQuota);
                                  if (!isNaN(quotaNum) && quotaNum >= 0) {
                                    try {
                                      await axios.put(`/admin/colleges/${col._id}/upgrade`, { aiReviewQuota: quotaNum });
                                      alert(`AI Review quota updated to ${quotaNum}`);
                                      fetchColleges();
                                    } catch (e) {
                                      alert(e.response?.data?.error || "Failed to update quota");
                                    }
                                  } else {
                                    alert("Please enter a valid number");
                                  }
                                }
                                setActiveDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100 flex items-center gap-1.5 font-medium transition-colors"
                            >
                              Configure AI Quota
                            </button>
                            <hr className="border-zinc-800 my-1" />
                            <button 
                              onClick={async () => {
                                try {
                                  const { data } = await axios.put(`/admin/colleges/${col._id}/toggle-active`);
                                  alert(data.message);
                                  fetchColleges();
                                  setActiveDropdown(null);
                                } catch (e) {
                                  alert(e.response?.data?.error || "Failed to toggle status.");
                                }
                              }}
                              className={`w-full px-3 py-2 flex items-center justify-between transition-colors ${
                                col.isActive !== false 
                                  ? 'text-amber-500 hover:bg-amber-500/10 hover:text-amber-400' 
                                  : 'text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-450'
                              }`}
                            >
                              <span>{col.isActive !== false ? "Deactivate College" : "Activate College"}</span>
                            </button>
                            <hr className="border-zinc-800 my-1" />
                            <button 
                              onClick={() => { handleDeleteCollege(col._id, col.name); setActiveDropdown(null); }}
                              className="w-full px-3 py-2 text-red-500 hover:bg-red-500/10 font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 size={12} /> Delete College
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollegesTable;
