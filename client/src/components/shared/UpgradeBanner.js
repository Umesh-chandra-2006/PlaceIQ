import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const UpgradeBanner = () => {
  const { updateUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data } = await axios.post('/admin/upgrade-simulation');
      updateUser({ subRole: data.userSubRole });
      alert("College upgraded to Pro plan successfully! (Simulation)");
      window.location.reload(); // Reload to refresh all layouts and sidebars
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to upgrade tier.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="bg-primary-600 rounded-lg p-4 mb-6 text-white flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Zap size={20} className="text-yellow-300" />
        </div>
        <div>
          <h3 className="font-bold">Unlock Pro Features</h3>
          <p className="text-sm text-primary-100">Get unlimited job listings, WhatsApp broadcasts, and advanced analytics.</p>
        </div>
      </div>
      <button 
        onClick={handleUpgrade}
        disabled={upgrading}
        className="bg-white text-primary-600 px-4 py-2 rounded-md font-semibold text-sm hover:bg-primary-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {upgrading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
        Upgrade Now
      </button>
    </div>
  );
};

export default UpgradeBanner;
