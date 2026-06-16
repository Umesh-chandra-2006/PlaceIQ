import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role === 'coordinator' || user.role === 'admin') return null;

  const isActive = (path) => {
    if (path === '/student') {
      return location.pathname === '/student';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
      <div className="px-4 py-3 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/student" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-xs">P</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-100">PlaceIQ</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/student" 
              className={`text-sm transition-colors ${isActive('/student') ? 'text-primary-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Job Feed
            </Link>
            <Link 
              to="/student/tracker" 
              className={`text-sm transition-colors ${isActive('/student/tracker') ? 'text-primary-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Tracker
            </Link>
            <Link 
              to="/student/announcements" 
              className={`text-sm transition-colors flex items-center gap-1 ${isActive('/student/announcements') ? 'text-primary-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Announcements
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/student/profile" className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors">
            <User size={16} />
          </Link>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
