import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldCheck, Key, AlertCircle } from 'lucide-react';

const SetupAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!email || !token) {
        setError('Invalid activation link. Missing email or token parameter.');
        setVerifying(false);
        return;
      }
      try {
        const { data } = await axios.get(`/auth/setup-verify?email=${encodeURIComponent(email)}&token=${token}`);
        setUserData(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Token verification failed. The activation link may be invalid or expired.');
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post('/auth/setup-complete', {
        email,
        token,
        password
      });

      alert("Account activated successfully! Please log in with your new password.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || "Failed to complete account setup.");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-500">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary-500" size={32} />
          <p className="text-sm font-mono uppercase tracking-wider font-semibold">Verifying activation link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/30 mb-4">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono">Setup Failed</h2>
          <p className="text-sm text-red-400 mt-2 font-medium leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-800 rounded text-sm bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-colors text-zinc-300 font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-10 h-10 bg-primary-500 rounded flex items-center justify-center border border-primary-500/20 mb-4 shadow-lg shadow-primary-500/20">
          <ShieldCheck size={20} className="text-zinc-950" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">Activate Account</h2>
        <p className="text-sm text-zinc-400 mt-2">Create a secure login password for your profile.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="bg-zinc-950/80 p-4 rounded border border-zinc-800 text-xs text-zinc-400 space-y-2">
            <div><span className="font-semibold text-zinc-600 uppercase tracking-widest text-[9px] block mb-0.5">Name</span><span className="text-zinc-200 font-medium">{userData.name}</span></div>
            <div><span className="font-semibold text-zinc-600 uppercase tracking-widest text-[9px] block mb-0.5">Email</span><span className="text-zinc-200 font-mono">{userData.email}</span></div>
            <div><span className="font-semibold text-zinc-600 uppercase tracking-widest text-[9px] block mb-0.5">Assigned Role</span><span className="capitalize text-zinc-200 font-medium">{userData.role}</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                id="new-password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                required
                placeholder="Confirm your password"
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
                Complete Activation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupAccount;
