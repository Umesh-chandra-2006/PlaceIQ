import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Zap, Target, LineChart, ShieldCheck, Menu, X } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If already logged in, redirect to respective dashboard
  if (user) {
    if (user.role === 'coordinator') return <Navigate to="/coordinator" />;
    if (user.role === 'student') return <Navigate to="/student" />;
    if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-primary-500/20 selection:text-primary-300 font-sans relative overflow-x-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Navigation */}
      <nav className="border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform duration-300">
                <span className="text-zinc-950 font-black text-base tracking-tighter">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-mono">PlaceIQ</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors duration-200">
                Log In
              </Link>
              <Link 
                to="/register" 
                className="text-sm font-semibold bg-white hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded transition-all duration-200 shadow-md shadow-white/5 active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-zinc-400 hover:text-white p-1.5 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-[#09090b] px-4 py-4 space-y-3 animate-fadeIn">
            <Link 
              to="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-800 rounded transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 text-sm font-semibold bg-white text-zinc-950 rounded hover:bg-zinc-200 transition-colors shadow-md"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main>
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Version Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800/80 text-[10px] font-bold font-mono text-primary-400 mb-8 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
              Security Update: Hierarchical provisioning active
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-white font-sans">
              Campus Placements, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
                engineered for absolute scale.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              The dual-interface placement network. Seamless trading-terminal efficiency for administrators and coordinators, matched with clean-room focus and ATS scoring for students.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm sm:max-w-none mx-auto">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-3 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 hover:shadow-primary-500/25 active:scale-95"
              >
                Access Platform <ArrowRight size={16} />
              </Link>
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded text-sm transition-all duration-200 active:scale-95"
              >
                How to Register
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-zinc-900 py-20 bg-[#09090b]/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-300">
                <Zap className="text-primary-500 mb-4" size={24} />
                <h3 className="text-base font-semibold text-white mb-2">Hybrid ATS Analyzer</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">Instant rule-based eligibility checks backed by OpenRouter AI deep resume analysis to maximize student potential.</p>
              </div>
              <div className="p-6 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-300">
                <Target className="text-primary-500 mb-4" size={24} />
                <h3 className="text-base font-semibold text-white mb-2">Smart Cohorts</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">Target job listings dynamically. Provision batches by CGPA, branch, or backlogs without application noise.</p>
              </div>
              <div className="p-6 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-300">
                <LineChart className="text-primary-500 mb-4" size={24} />
                <h3 className="text-base font-semibold text-white mb-2">Real-Time Risk Flags</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">Advanced pipeline tracking instantly flags at-risk candidates missing applications or containing active backlogs.</p>
              </div>
              <div className="p-6 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-300">
                <ShieldCheck className="text-primary-500 mb-4" size={24} />
                <h3 className="text-base font-semibold text-white mb-2">Strict Security Model</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">Top-down credential provisioning prevents unauthorized access. Secure, token-based setup links for all roles.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center text-zinc-600 text-xs font-medium bg-[#09090b]">
        <p>© {new Date().getFullYear()} PlaceIQ. Dedicated enterprise portal architecture.</p>
      </footer>
    </div>
  );
};

export default Landing;
