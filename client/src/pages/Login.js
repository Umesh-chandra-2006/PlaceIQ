import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'coordinator') navigate('/coordinator');
      else if (user.role === 'student') navigate('/student');
      else if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/20 selection:text-primary-300 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-10 h-10 bg-primary-500 rounded flex items-center justify-center shadow-lg shadow-primary-500/25 mb-4 hover:scale-105 transition-transform duration-300">
          <span className="text-zinc-950 font-black text-lg tracking-tighter">P</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white font-mono tracking-tight">PlaceIQ</h2>
        <p className="mt-2 text-sm text-zinc-400">Sign in to access your placement dashboard</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg py-8 px-6 sm:px-10 shadow-2xl backdrop-blur-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-10 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-sans"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold py-2 rounded text-sm transition-all duration-200 shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-800/80 pt-6">
            <div className="text-center text-xs">
              <span className="text-zinc-500 font-medium">New to PlaceIQ? </span>
              <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                Registration details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
