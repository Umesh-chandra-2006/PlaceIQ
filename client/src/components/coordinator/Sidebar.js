import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, Users, Megaphone, BarChart3, LogOut, CheckCircle, User } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Overview', path: '/coordinator', icon: LayoutDashboard, exact: true },
    { name: 'Jobs & Listings', path: '/coordinator/jobs', icon: Briefcase },
    { name: 'Student Directory', path: '/coordinator/students', icon: Users },
    { name: 'Announcements', path: '/coordinator/announcements', icon: Megaphone },
    { name: 'My Profile', path: '/coordinator/profile', icon: User },
  ];

  if (user?.subRole === 'coordinator_paid') {
    navLinks.push({ name: 'Analytics', path: '/coordinator/analytics', icon: BarChart3 });
  }

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-zinc-950 border-r border-zinc-800 flex flex-col text-zinc-300">
      <div className="p-4 border-b border-zinc-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
            <CheckCircle size={14} className="text-zinc-950" />
          </div>
          <span className="font-bold text-zinc-100 tracking-tight">PlaceIQ Ops</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Workspace</div>
        <nav className="space-y-0.5 px-2">
          {navLinks.map((link) => {
            const isActive = link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  isActive 
                    ? 'bg-zinc-800/50 text-zinc-100 font-medium' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-primary-500' : 'text-zinc-500'} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-sm font-medium text-zinc-200 truncate">{user?.name}</span>
            <span className="text-[10px] font-mono text-zinc-500 truncate" title={user?.email}>{user?.email}</span>
            <span className="text-[9px] font-mono text-indigo-400 mt-1 uppercase tracking-widest">{user?.subRole?.replace('_', ' ')}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
