import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User, Building, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const { data } = await axios.get('/auth/college');
        setCollege(data);
      } catch (err) {
        console.error('Error fetching college details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollege();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary-500" size={24} />
      </div>
    );
  }

  const isPaid = user?.subRole === 'coordinator_paid' || college?.licenceStatus === 'paid';

  return (
    <div className="space-y-6 text-zinc-100 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium tracking-tight">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Personal Information</h3>
              <p className="text-[10px] text-zinc-500 font-mono">User ID: {user?._id}</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-500 uppercase text-xs">Name</span>
              <span className="text-zinc-300 font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-500 uppercase text-xs">Email</span>
              <span className="text-zinc-300 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-500 uppercase text-xs">System Role</span>
              <span className="text-zinc-300 font-medium uppercase text-xs tracking-wider">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500 uppercase text-xs">Access Tier</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${
                isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isPaid ? 'Paid Pro' : 'Free Trial'}
              </span>
            </div>
            <div className="pt-4 border-t border-zinc-900 flex justify-between items-center mt-2">
              <span className="text-zinc-500 text-xs uppercase">Help & Tour</span>
              <button 
                onClick={async () => {
                  localStorage.removeItem(`has-completed-tour-coordinator`);
                  try {
                    await axios.put('/auth/reset-tour');
                  } catch (e) {}
                  alert("Onboarding walkthrough tour reset. Redirecting to dashboard...");
                  window.location.href = '/coordinator';
                }}
                className="text-[10px] uppercase font-bold text-primary-500 hover:text-primary-400 transition-colors font-mono"
              >
                Restart Walkthrough Tour
              </button>
            </div>
          </div>
        </div>

        {/* Institution Details Card */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Institution Details</h3>
              <p className="text-[10px] text-zinc-500 font-mono">College ID: {user?.collegeId}</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-500 uppercase text-xs">College Name</span>
              <span className="text-zinc-300 font-medium">{college?.name || 'Loading...'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-500 uppercase text-xs">Email Domain</span>
              <span className="text-zinc-300 font-medium">@{college?.emailDomain || 'Loading...'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500 uppercase text-xs">License Status</span>
              <span className="text-zinc-300 font-medium capitalize">{college?.licenceStatus || 'free'}</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Profile;
