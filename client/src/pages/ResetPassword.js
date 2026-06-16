import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { Loader2, ShieldCheck, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid or incomplete reset link. Missing email or token.');
    }
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !token) {
      toast.error('Missing activation parameters.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/auth/reset-password', {
        email,
        token,
        password
      });
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to reset password.';
      setError(errMsg);
      toast.error(errMsg);
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
          <ShieldCheck size={20} className="text-zinc-950" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">Reset Password</h2>
        <p className="text-sm text-zinc-400 mt-2">Enter your new login credentials below</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start gap-3 text-xs font-semibold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!error && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  id="password"
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
                  Reset Password
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-zinc-800/80 pt-4 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">
              <ArrowLeft size={12} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
export { ResetPassword };
