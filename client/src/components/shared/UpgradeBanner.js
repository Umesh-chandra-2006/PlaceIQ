/**
 * Banner shown to free-tier coordinators to encourage upgrading.
 */
import React from 'react';
import { Zap } from 'lucide-react';

const UpgradeBanner = () => {
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
      <button className="bg-white text-primary-600 px-4 py-2 rounded-md font-semibold text-sm hover:bg-primary-50 transition-colors">
        Upgrade Now
      </button>
    </div>
  );
};

export default UpgradeBanner;
