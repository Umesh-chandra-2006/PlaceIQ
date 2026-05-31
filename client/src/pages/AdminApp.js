import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, Save, LogOut, Plus, Shield, Globe, Award, Check, Copy, LayoutDashboard, Sliders, Users } from 'lucide-react';
import Sidebar from '../components/shared/Sidebar';

const AdminApp = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ departments: [], cgpaScale: 10 });
  const [deptInput, setDeptInput] = useState("");
  
  // Super Admin state
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [newCollege, setNewCollege] = useState({ 
    name: '', 
    emailDomain: '', 
    licenceStatus: 'free',
    adminName: '',
    adminEmail: ''
  });
  const [submittingCollege, setSubmittingCollege] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // College Admin state
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'coordinators'
  const [coordinators, setCoordinators] = useState([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState({ name: '', email: '' });
  const [submittingCoordinator, setSubmittingCoordinator] = useState(false);
  const [generatedCoordLink, setGeneratedCoordLink] = useState('');

  // Overview stats for College Admin
  const [stats, setStats] = useState(null);

  // Clipboard feedback
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (user.role === 'admin') {
      fetchConfig();
      fetchCoordinators();
      fetchStats();
    } else if (user.role === 'superadmin') {
      fetchColleges();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/analytics/overview');
      setStats(data);
    } catch (error) {
      console.error("Error fetching overview stats", error);
    }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get('/admin/college-settings');
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const { data } = await axios.get('/admin/colleges');
      setColleges(data);
    } catch (error) {
      console.error("Error fetching colleges", error);
    } finally {
      setLoading(false);
      setLoadingColleges(false);
    }
  };

  const fetchCoordinators = async () => {
    setLoadingCoordinators(true);
    try {
      const { data } = await axios.get('/admin/coordinators');
      setCoordinators(data);
    } catch (error) {
      console.error("Error fetching coordinators", error);
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/admin/college-settings', config);
      alert("Settings saved successfully.");
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!newCollege.name || !newCollege.emailDomain || !newCollege.adminName || !newCollege.adminEmail) {
      return alert("Please fill out all fields.");
    }
    setSubmittingCollege(true);
    setGeneratedLink('');
    try {
      const { data } = await axios.post('/admin/colleges', newCollege);
      alert("College and admin registered successfully!");
      setGeneratedLink(data.setupLink);
      setNewCollege({ name: '', emailDomain: '', licenceStatus: 'free', adminName: '', adminEmail: '' });
      fetchColleges();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to register college.");
    } finally {
      setSubmittingCollege(false);
    }
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    if (!newCoordinator.name || !newCoordinator.email) {
      return alert("Please fill out both Name and Email.");
    }
    setSubmittingCoordinator(true);
    setGeneratedCoordLink('');
    try {
      const { data } = await axios.post('/admin/coordinators', newCoordinator);
      alert("Coordinator registered successfully!");
      setGeneratedCoordLink(data.setupLink);
      setNewCoordinator({ name: '', email: '' });
      fetchCoordinators();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to register coordinator.");
    } finally {
      setSubmittingCoordinator(false);
    }
  };

  const handleUpdateLicence = async (id, status) => {
    try {
      await axios.put(`/admin/colleges/${id}/upgrade`, { licenceStatus: status });
      alert(`Licence status updated to ${status}`);
      fetchColleges();
    } catch (error) {
      alert("Failed to update licence status.");
    }
  };

  const addDepartment = () => {
    if (deptInput && !config.departments.includes(deptInput)) {
      setConfig({ ...config, departments: [...config.departments, deptInput.toUpperCase()] });
      setDeptInput("");
    }
  };

  const removeDepartment = (dept) => {
    setConfig({ ...config, departments: config.departments.filter(d => d !== dept) });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const renderSuperAdmin = () => {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Super Admin Control Center</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage registered colleges and licenses across the platform.</p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Total Colleges</span>
            <span className="text-4xl font-bold font-mono">{colleges.length}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-emerald-500">Pro License (Paid)</span>
            <span className="text-4xl font-bold font-mono text-emerald-500">{colleges.filter(c => c.licenceStatus === 'paid').length}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-amber-500">Free License</span>
            <span className="text-4xl font-bold font-mono text-amber-500">{colleges.filter(c => c.licenceStatus === 'free').length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colleges Directory Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-300">Registered Colleges</h2>
              {loadingColleges && <Loader2 className="animate-spin text-zinc-500" size={16} />}
            </div>

            <div className="border border-zinc-800 rounded bg-zinc-900/10 overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">College Name</th>
                    <th className="px-4 py-3">Email Domain</th>
                    <th className="px-4 py-3">Licence Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {colleges.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">No colleges registered.</td></tr>
                  ) : colleges.map((college) => (
                    <tr key={college._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-200">{college.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{college._id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">@{college.emailDomain}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                          college.licenceStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          college.licenceStatus === 'expired' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {college.licenceStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleUpdateLicence(college._id, 'paid')}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${college.licenceStatus === 'paid' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                          >
                            PRO
                          </button>
                          <button 
                            onClick={() => handleUpdateLicence(college._id, 'free')}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${college.licenceStatus === 'free' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                          >
                            FREE
                          </button>
                          <button 
                            onClick={() => handleUpdateLicence(college._id, 'expired')}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${college.licenceStatus === 'expired' ? 'bg-red-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                          >
                            EXP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registration & Feedback Area */}
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
                  <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">College Name</label>
                  <input 
                    type="text" required
                    value={newCollege.name}
                    onChange={e => setNewCollege({ ...newCollege, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
                    placeholder="e.g. Anurag University"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Email Domain</label>
                  <input 
                    type="text" required
                    value={newCollege.emailDomain}
                    onChange={e => setNewCollege({ ...newCollege, emailDomain: e.target.value.replace(/@/g, '') })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                    placeholder="e.g. anurag.edu.in"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Enter only the domain — <strong className="text-zinc-400">without @</strong> (e.g. <span className="font-mono">anu.edu.in</span>, not @anu.edu.in).</span>
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Admin Full Name</label>
                  <input 
                    type="text" required
                    value={newCollege.adminName}
                    onChange={e => setNewCollege({ ...newCollege, adminName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
                    placeholder="e.g. Dr. K. Prasanna"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Admin Email</label>
                  <input 
                    type="email" required
                    value={newCollege.adminEmail}
                    onChange={e => setNewCollege({ ...newCollege, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                    placeholder="e.g. kprasanna@anurag.edu.in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono uppercase text-zinc-400 tracking-wider mb-1.5">Licence Tier</label>
                  <select 
                    value={newCollege.licenceStatus}
                    onChange={e => setNewCollege({ ...newCollege, licenceStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 font-sans"
                  >
                    <option value="free">Free Tier (Limit 5 active jobs)</option>
                    <option value="paid">Pro Tier (Unlimited & Analytics)</option>
                  </select>
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
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">College Administration</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage configuration parameters for your institution's placement portal.</p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-2">College Settings</h2>
          <p className="text-sm text-zinc-400 mb-8">Set limits and configurations for onboarding profiles.</p>
          
          <div className="space-y-8">
            {/* CGPA Scale */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">CGPA Scale Constraint</h3>
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
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[11px] font-mono">Academic Departments</h3>
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
      </div>
    );
  };

  const renderCoordinators = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Coordinators Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Provision and manage accounts for placement coordinators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Coordinators */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 text-[11px] font-mono">College Coordinators</h2>
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
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const isPaid = stats?.cycle?.collegeId || false;
    return (
      <div className="space-y-6 animate-fadeIn font-sans text-zinc-100">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Institution Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Overview of coordinator management and placement statistics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded-lg flex flex-col justify-between h-24">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Coordinators</span>
            <span className="text-3xl font-bold font-mono text-indigo-400">{coordinators.length}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded-lg flex flex-col justify-between h-24">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Total Students</span>
            <span className="text-3xl font-bold font-mono text-zinc-200">{stats?.totalStudents || 0}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded-lg flex flex-col justify-between h-24">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Students Placed</span>
            <span className="text-3xl font-bold font-mono text-emerald-400">{stats?.placedStudents || 0}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded-lg flex flex-col justify-between h-24">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Placement Rate</span>
            <span className="text-3xl font-bold font-mono text-primary-500">
              {stats?.placementRate ? stats.placementRate.toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* License Status */}
          <div className="border border-zinc-850 rounded-lg p-6 bg-zinc-950/40 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 border-b border-zinc-850 pb-3 font-mono text-[11px]">Licence Information</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-550">Institution Domain:</span>
                <span className="text-zinc-300">@{user?.email?.split('@')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Licence Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isPaid ? 'Active Tier' : 'Sandbox (Free)'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Config details */}
          <div className="border border-zinc-850 rounded-lg p-6 bg-zinc-950/40 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 border-b border-zinc-850 pb-3 font-mono text-[11px]">Active Settings</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-550">CGPA Grading Scale:</span>
                <span className="text-zinc-200">{config.cgpaScale}-Point Scale</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Configured Branches:</span>
                <span className="text-zinc-200 truncate max-w-[200px]" title={config.departments.join(', ')}>
                  {config.departments.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 selection:bg-primary-500/30 selection:text-primary-100 font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 pt-16 md:pt-8 p-4 md:p-8">
        <Routes>
          {user.role === 'superadmin' ? (
            <Route path="/" element={renderSuperAdmin()} />
          ) : (
            <>
              <Route path="/" element={renderAdminDashboard()} />
              <Route path="/settings" element={renderSettings()} />
              <Route path="/coordinators" element={renderCoordinators()} />
            </>
          )}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminApp;
