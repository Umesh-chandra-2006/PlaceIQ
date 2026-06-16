import React from 'react';
import { Loader2, Save } from 'lucide-react';

const CollegeSettings = ({
  config,
  setConfig,
  deptInput,
  setDeptInput,
  addDepartment,
  removeDepartment,
  handleSave,
  saving
}) => {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-2">College Settings</h2>
      <p className="text-sm text-zinc-400 mb-8">Set limits and configurations for onboarding profiles.</p>
      
      <div className="space-y-8">
        {/* CGPA Scale */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">CGPA Scale Constraint</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="radio" name="cgpa" 
                checked={config.cgpaScale === 10} 
                onChange={() => setConfig({...config, cgpaScale: 10})} 
                className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" 
              />
              10-Point Scale
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="radio" name="cgpa" 
                checked={config.cgpaScale === 5} 
                onChange={() => setConfig({...config, cgpaScale: 5})} 
                className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" 
              />
              5-Point Scale
            </label>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-medium">This enforces a maximum limit when students are onboarding.</p>
        </div>

        <hr className="border-zinc-800" />

        {/* Departments */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">Academic Departments</h3>
          <p className="text-xs text-zinc-500 mb-4 font-medium">Students must select one of these departments during onboarding.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {config.departments.map(dept => (
              <div key={dept} className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded text-xs font-semibold text-zinc-300 border border-zinc-700 font-mono">
                {dept}
                <button 
                  onClick={() => removeDepartment(dept)} 
                  className="text-zinc-500 hover:text-red-500 font-bold ml-1 font-sans"
                >
                  &times;
                </button>
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
            <button 
              type="button" 
              onClick={addDepartment} 
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors text-zinc-300"
            >
              Add
            </button>
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
  );
};

export default CollegeSettings;
