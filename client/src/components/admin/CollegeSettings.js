import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

const CollegeSettings = ({
  config,
  handleSave,
  saving
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [deptInput, setDeptInput] = useState("");

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const addDepartment = () => {
    const trimmed = (deptInput || "").trim().toUpperCase();
    if (trimmed && !localConfig.departments.includes(trimmed)) {
      setLocalConfig({
        ...localConfig,
        departments: [...localConfig.departments, trimmed]
      });
      setDeptInput("");
    }
  };

  const removeDepartment = (dept) => {
    setLocalConfig({
      ...localConfig,
      departments: localConfig.departments.filter(d => d !== dept)
    });
  };

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-2 font-sans">College Settings</h2>
      <p className="text-sm text-zinc-400 mb-8 font-sans">Set limits and configurations for onboarding profiles.</p>
      
      <div className="space-y-8">
        {/* CGPA Scale */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">CGPA Scale Constraint</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="radio" name="cgpa" 
                checked={localConfig.cgpaScale === 10} 
                onChange={() => setLocalConfig({...localConfig, cgpaScale: 10})} 
                className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" 
              />
              10-Point Scale
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="radio" name="cgpa" 
                checked={localConfig.cgpaScale === 5} 
                onChange={() => setLocalConfig({...localConfig, cgpaScale: 5})} 
                className="text-primary-500 focus:ring-primary-500 bg-zinc-900 border-zinc-700" 
              />
              5-Point Scale
            </label>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-medium font-sans">This enforces a maximum limit when students are onboarding.</p>
        </div>

        <hr className="border-zinc-800" />

        {/* Departments */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">Academic Departments</h3>
          <p className="text-xs text-zinc-500 mb-4 font-medium font-sans">Students must select one of these departments during onboarding.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {localConfig.departments.map(dept => (
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
            {localConfig.departments.length === 0 && (
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
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700 text-zinc-100 font-sans"
            />
            <button 
              type="button" 
              onClick={addDepartment} 
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-sm font-medium transition-colors text-zinc-300 font-sans"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={() => handleSave(localConfig)} 
            disabled={saving}
            className="bg-primary-500 hover:bg-primary-400 text-zinc-950 px-6 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 font-sans"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeSettings;
