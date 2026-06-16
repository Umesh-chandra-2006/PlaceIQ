import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { Loader2, Mail, ArrowLeft, Key } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset link dispatched! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300 relative overflow-hidden">
      <Toaster position="top-right" />
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-10 h-10 bg-primary-500 rounded flex items-center justify-center shadow-lg shadow-primary-500/25 mb-4 hover:scale-105 transition-transform duration-300">
          <Key size={20} className="text-zinc-950" />
        </div>
        <h2 className="text-3xl font-extrabold text-white font-mono tracking-tight">Recover Password</h2>
        <p className="mt-2 text-sm text-zinc-400">Enter your email and we'll send you a recovery link</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg py-8 px-6 sm:px-10 shadow-2xl backdrop-blur-md">
          {!submitted ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-10 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-sans"
                    placeholder="you@domain.com"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit" 
                  disabled={loading || !email}
                  className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold py-2 rounded text-sm transition-all duration-200 shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg inline-block text-sm font-semibold font-mono">
                Email Dispatched Successfully
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                A password recovery link has been sent to <strong>{email}</strong>. It is valid for 1 hour. Please check your spam folder if you do not receive it shortly.
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-zinc-800/80 pt-6">
            <div className="text-center text-xs">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
export { ForgotPassword };
