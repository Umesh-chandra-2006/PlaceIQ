import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, Shield, Sparkles } from 'lucide-react';
import UpgradeBanner from '../components/shared/UpgradeBanner';
import AdminLayout from '../components/admin/AdminLayout';
import CollegesTable from '../components/admin/CollegesTable';
import SuperAdminPanel from '../components/admin/SuperAdminPanel';
import CollegeSettings from '../components/admin/CollegeSettings';
import CoordinatorDirectory from '../components/admin/CoordinatorDirectory';

const AdminApp = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ departments: [], cgpaScale: 10 });
  
  // Super Admin state
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [newCollege, setNewCollege] = useState({ 
    name: '', 
    emailDomain: '', 
    licenceStatus: 'free',
    adminName: '',
    adminEmail: '',
    aiReviewQuota: 3
  });
  const [submittingCollege, setSubmittingCollege] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // College Admin state
  const [coordinators, setCoordinators] = useState([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState({ name: '', email: '' });
  const [submittingCoordinator, setSubmittingCoordinator] = useState(false);
  const [generatedCoordLink, setGeneratedCoordLink] = useState('');

  // Overview stats for College Admin
  const [stats, setStats] = useState(null);

  // Clipboard feedback
  const [copiedText, setCopiedText] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close active dropdown on scroll or click outside
  useEffect(() => {
    if (!activeDropdown) return;
    
    const handleClose = (e) => {
      if (e.type === 'scroll' || !e.target.closest('.relative.flex.justify-end')) {
        setActiveDropdown(null);
      }
    };

    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('click', handleClose, true);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('click', handleClose, true);
    };
  }, [activeDropdown]);

  const [college, setCollege] = useState(null);
  const [upgradingCollege, setUpgradingCollege] = useState(false);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchConfig();
      fetchCoordinators();
      fetchStats();
      fetchCollege();
    } else if (user.role === 'superadmin') {
      fetchColleges();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCollege = async () => {
    try {
      const { data } = await axios.get('/auth/college');
      setCollege(data);
    } catch (error) {
      console.error("Error fetching college details", error);
    }
  };

  const handleUpgradeCollege = async () => {
    setUpgradingCollege(true);
    try {
      const { data } = await axios.post('/admin/upgrade-simulation');
      alert(data.message);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to simulate upgrade.');
    } finally {
      setUpgradingCollege(false);
    }
  };

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

  const handleSave = async (updatedConfig) => {
    setSaving(true);
    try {
      await axios.put('/admin/college-settings', updatedConfig);
      setConfig(updatedConfig);
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
      setNewCollege({ name: '', emailDomain: '', licenceStatus: 'free', adminName: '', adminEmail: '', aiReviewQuota: 3 });
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

  const handleRegenerateCoordinatorSetup = async (id) => {
    if (window.confirm("Regenerate a fresh setup link for this coordinator? The old setup link will expire.")) {
      try {
        const { data } = await axios.post(`/admin/coordinators/${id}/regenerate-setup`);
        setGeneratedCoordLink(data.setupLink);
        alert("Fresh setup link generated successfully! You can copy it from the generated link box.");
        fetchCoordinators();
      } catch (e) {
        alert(e.response?.data?.error || "Failed to regenerate coordinator setup link.");
      }
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

  const handleDeleteCollege = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will suspend all its users and cannot be undone.`)) {
      try {
        await axios.delete(`/admin/colleges/${id}`);
        alert("College deleted successfully.");
        fetchColleges();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to delete college.");
      }
    }
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">Super Admin Control Center</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage registered colleges and licenses across the platform.</p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Total Colleges</span>
            <span className="text-4xl font-bold font-mono">{colleges.length}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-550 uppercase tracking-widest text-emerald-500">Pro License (Paid)</span>
            <span className="text-4xl font-bold font-mono text-emerald-500">{colleges.filter(c => c.licenceStatus === 'paid').length}</span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-5 rounded flex flex-col justify-between h-24">
            <span className="text-xs font-mono text-zinc-550 uppercase tracking-widest text-amber-500">Free License</span>
            <span className="text-4xl font-bold font-mono text-amber-500">{colleges.filter(c => c.licenceStatus === 'free').length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CollegesTable 
            colleges={colleges}
            loadingColleges={loadingColleges}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
            fetchColleges={fetchColleges}
            handleUpdateLicence={handleUpdateLicence}
            handleDeleteCollege={handleDeleteCollege}
            setGeneratedLink={setGeneratedLink}
          />
          <SuperAdminPanel 
            newCollege={newCollege}
            setNewCollege={setNewCollege}
            submittingCollege={submittingCollege}
            generatedLink={generatedLink}
            copiedText={copiedText}
            copyToClipboard={copyToClipboard}
            handleCreateCollege={handleCreateCollege}
          />
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const isPaid = college?.licenceStatus === 'paid';
    return (
      <div className="space-y-6 animate-fadeIn font-sans text-zinc-100">
        {!isPaid && <UpgradeBanner />}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">Institution Dashboard</h1>
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
                <span className="text-zinc-500">Institution Domain:</span>
                <span className="text-zinc-300 font-sans">@{user?.email?.split('@')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Licence Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
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

  const renderProfile = () => {
    const isPaid = college?.licenceStatus === 'paid';
    const isSuperAdmin = user?.role === 'superadmin';
    return (
      <div className="space-y-6 text-zinc-100 max-w-xl animate-fadeIn font-sans">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-100 font-sans">My Profile</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isSuperAdmin ? 'Your super administrator account profile details.' : 'Your administrator account profile details.'}
          </p>
        </div>

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800/40 pb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-zinc-200">Account Information</h3>
              <p className="text-[10px] text-zinc-500 font-mono">User ID: {user?._id}</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/20">
              <span className="text-zinc-550 uppercase">Name:</span>
              <span className="text-zinc-200 font-sans">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/20">
              <span className="text-zinc-550 uppercase">Email:</span>
              <span className="text-zinc-200">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-550 uppercase">System Role:</span>
              <span className="text-primary-500 uppercase font-bold tracking-widest">{user?.role}</span>
            </div>
            {!isSuperAdmin && (
              <div className="flex justify-between py-1">
                <span className="text-zinc-550 uppercase">Access Tier:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${
                  isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isPaid ? 'Paid Pro' : 'Free Trial'}
                </span>
              </div>
            )}
          </div>

          {!isSuperAdmin && !isPaid && (
            <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
              <div className="bg-primary-500/5 border border-primary-500/10 p-3 rounded text-xs text-primary-400/80 leading-relaxed flex items-start gap-2">
                <Sparkles size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Simulate upgrading to the Paid tier to unlock unlimited Job postings, ScrapeGraphAI-powered scraping, and Recharts visual analytics.</span>
              </div>
              <button
                onClick={handleUpgradeCollege}
                disabled={upgradingCollege}
                className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {upgradingCollege && <Loader2 className="animate-spin" size={12} />}
                Upgrade College Plan (Simulation)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        {user.role === 'superadmin' ? (
          <>
            <Route path="/" element={renderSuperAdmin()} />
            <Route path="/profile" element={renderProfile()} />
          </>
        ) : (
          <>
            <Route path="/" element={renderAdminDashboard()} />
            <Route path="/settings" element={
              <CollegeSettings 
                config={config}
                handleSave={handleSave}
                saving={saving}
              />
            } />
            <Route path="/coordinators" element={
              <CoordinatorDirectory 
                coordinators={coordinators}
                loadingCoordinators={loadingCoordinators}
                newCoordinator={newCoordinator}
                setNewCoordinator={setNewCoordinator}
                submittingCoordinator={submittingCoordinator}
                generatedCoordLink={generatedCoordLink}
                copiedText={copiedText}
                copyToClipboard={copyToClipboard}
                handleCreateCoordinator={handleCreateCoordinator}
                handleRegenerateSetup={handleRegenerateCoordinatorSetup}
              />
            } />
            <Route path="/profile" element={renderProfile()} />
          </>
        )}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
