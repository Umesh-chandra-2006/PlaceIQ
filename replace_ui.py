import sys

with open('d:/placeiq (1)/placeiq/client/src/pages/AdminApp.js', 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('// Regular College Admin view')
if len(parts) == 2:
    new_ui = """// Regular College Admin view
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center">
              <Shield size={16} className="text-zinc-950" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">College Administration</h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 mb-8">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-zinc-200 text-zinc-200' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            College Settings
          </button>
          <button 
            onClick={() => {
              setActiveTab('coordinators');
              fetchCoordinators();
            }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'coordinators' ? 'border-zinc-200 text-zinc-200' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Coordinators Directory
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mb-2">College Settings</h2>
            <p className="text-sm text-zinc-400 mb-8">Manage configuration parameters for your institution's placement portal.</p>
            
            <div className="space-y-8">
              {/* CGPA Scale */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px]">CGPA Scale Constraint</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input type="radio" name="cgpa" checked={config.cgpaScale === 10} onChange={() => setConfig({...config, cgpaScale: 10})} className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" />
                    10-Point Scale
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input type="radio" name="cgpa" checked={config.cgpaScale === 5} onChange={() => setConfig({...config, cgpaScale: 5})} className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" />
                    5-Point Scale
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-2 font-medium">This enforces a maximum limit when students are onboarding.</p>
              </div>

              <hr className="border-zinc-800" />

              {/* Departments */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px]">Academic Departments</h3>
                <p className="text-xs text-zinc-500 mb-4 font-medium">Students must select one of these departments during onboarding.</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {config.departments.map(dept => (
                    <div key={dept} className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded text-xs font-semibold text-zinc-300 border border-zinc-700 font-mono">
                      {dept}
                      <button onClick={() => removeDepartment(dept)} className="text-zinc-500 hover:text-red-500 font-bold ml-1 font-sans">&times;</button>
                    </div>
                  ))}
                  {config.departments.length === 0 && (
                    <span className="text-xs text-zinc-500 italic font-mono">No departments configured yet.</span>
                  )}
                </div>
                
                <div className="flex gap-2 max-w-xs">
                  <input 
                    type="text" 
                    placeholder="e.g. CSE" 
                    value={deptInput}
                    onChange={e => setDeptInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDepartment())}
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700 text-zinc-100"
                  />
                  <button type="button" onClick={addDepartment} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors text-zinc-300">Add</button>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary-500 hover:bg-primary-400 text-zinc-950 px-6 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Settings
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of Coordinators */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 text-[11px]">College Coordinators</h2>
                {loadingCoordinators && <Loader2 className="animate-spin text-zinc-500" size={16} />}
              </div>

              <div className="border border-zinc-800 rounded bg-zinc-900/10 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Coordinator Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Setup Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {coordinators.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">No coordinators provisioned yet.</td></tr>
                    ) : coordinators.map((coord) => {
                      const link = `http://localhost:3000/setup-account?email=${encodeURIComponent(coord.email)}&token=${coord.setupToken}`;
                      return (
                        <tr key={coord._id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-200">{coord.name}</td>
                          <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{coord.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                              coord.isSetup ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {coord.isSetup ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!coord.isSetup && coord.setupToken ? (
                              <button 
                                onClick={() => copyToClipboard(link, coord._id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                {copiedText === coord._id ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Copy Link
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-500 italic font-semibold">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Provision Coordinator Form */}
            <div className="space-y-6">
              {generatedCoordLink && (
                <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 rounded space-y-3">
                  <h3 className="text-sm font-semibold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check size={16} /> Setup Link Generated
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Provide the following link to the coordinator. They must use it to activate their account and set their password.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedCoordLink}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300 focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(generatedCoordLink, 'coord-setup')}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                      title="Copy setup link"
                    >
                      {copiedText === 'coord-setup' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-300">Provision Coordinator</h2>
                <form onSubmit={handleCreateCoordinator} className="border border-zinc-800 bg-zinc-900/20 p-5 rounded space-y-4">
                  <div>
                    <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Coordinator Name</label>
                    <input 
                      type="text" required
                      value={newCoordinator.name}
                      onChange={e => setNewCoordinator({ ...newCoordinator, name: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
                      placeholder="e.g. Prof. R. Ramanujam"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" required
                      value={newCoordinator.email}
                      onChange={e => setNewCoordinator({ ...newCoordinator, email: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                      placeholder="e.g. ramanujam@anurag.edu.in"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1.5 block font-medium">Must be a valid email within the college domain.</span>
                  </div>

                  <button 
                    type="submit" disabled={submittingCoordinator}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingCoordinator ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    Create Coordinator
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApp;
"""
    with open('d:/placeiq (1)/placeiq/client/src/pages/AdminApp.js', 'w', encoding='utf-8') as f:
        f.write(parts[0] + new_ui)
    print('Replaced')
else:
    print('Failed to find split point')
