import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert, Key } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFirstLogin = user?.role === 'student' && !user?.isOnboarded;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Password updated successfully!');
      
      setTimeout(() => {
        if (isFirstLogin) {
          // Update local storage user details to flag we completed change-password (or just navigate to onboard)
          navigate('/student/onboard');
        } else {
          // Go back to profile / dashboard
          if (user?.role === 'coordinator') navigate('/coordinator');
          else if (user?.role === 'admin' || user?.role === 'superadmin') navigate('/admin');
          else navigate('/student');
        }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300 relative overflow-hidden">
      <Toaster position="top-right" />
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-10 h-10 bg-primary-500 rounded flex items-center justify-center border border-primary-500/20 mb-4 shadow-lg shadow-primary-500/20">
          <Key size={20} className="text-zinc-950" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
          {isFirstLogin ? 'Update Temporary Password' : 'Change Password'}
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          {isFirstLogin 
            ? 'For security, please update your temporary password before onboarding.' 
            : 'Update your login password below'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {isFirstLogin && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg flex items-start gap-3 text-xs leading-relaxed font-sans">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200">First-time login detected.</span> Institutional security policy requires changing the default password (`student123`) before entering the student workspace.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                id="current-password"
                type="password"
                required
                placeholder={isFirstLogin ? "Default is student123" : "Enter current password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                id="new-password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold py-2 rounded text-sm transition-all duration-205 shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-95 flex justify-center items-center gap-1.5"
              >
                {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Key size={14} />}
                Update Password
              </button>
            </div>
          </form>

          {!isFirstLogin && (
            <div className="border-t border-zinc-800/80 pt-4 text-center">
              <button 
                onClick={() => navigate(-1)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel &amp; Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
export { ChangePassword };
