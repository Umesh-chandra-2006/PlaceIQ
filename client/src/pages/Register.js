import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, AlertTriangle } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-10 h-10 bg-primary-500 rounded flex items-center justify-center border border-primary-500/20 mb-4 shadow-lg shadow-primary-500/20">
          <Shield size={20} className="text-zinc-950" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white font-mono">Account Provisioning</h2>
        <p className="text-sm text-zinc-400 mt-2">PlaceIQ institutional placement network.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-start gap-3 bg-zinc-950 border border-zinc-850 p-4 rounded-md">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-200">Public registration is closed.</span> Accounts are whitelisted and provisioned securely by the global System Admin, institutional College Admins, or cohort Coordinators.
            </div>
          </div>

          <div className="space-y-4 text-sm text-zinc-300">
            <h3 className="font-semibold text-white font-mono uppercase tracking-wider text-[11px]">How to access the platform:</h3>
            <ul className="space-y-3 pl-1 leading-relaxed text-xs list-disc list-inside">
              <li><strong className="text-zinc-100">Students:</strong> Your placement coordinator will create your account and share your email and the default login password (`student123`).</li>
              <li><strong className="text-zinc-100">Coordinators:</strong> Your College Admin will provision your account and provide a unique setup link.</li>
              <li><strong className="text-zinc-100">College Admins:</strong> The Prime System Admin authorizes your institution and issues your setup link.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-3">
            <Link 
              to="/login" 
              className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold py-2 rounded text-center text-sm transition-all duration-200 shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-95 flex justify-center items-center gap-1.5"
            >
              <Key size={14} /> Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
