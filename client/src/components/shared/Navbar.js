/**
 * Shared Navbar component with role-based navigation links.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Briefcase, LayoutDashboard, BarChart3, Users, Megaphone } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <Link to="/" className="flex ml-2 md:mr-24">
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-primary-600">PlaceIQ</span>
            </Link>
            <div className="hidden md:flex space-x-8 ml-10">
              {user.role === 'coordinator' && (
                <>
                  <Link to="/coordinator" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <Link to="/coordinator/jobs" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <Briefcase size={18} /> Jobs
                  </Link>
                  <Link to="/coordinator/students" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <Users size={18} /> Students
                  </Link>
                  {user.subRole === 'coordinator_paid' && (
                    <Link to="/coordinator/analytics" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                      <BarChart3 size={18} /> Analytics
                    </Link>
                  )}
                  <Link to="/coordinator/announcements" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <Megaphone size={18} /> Announcements
                  </Link>
                </>
              )}
              {user.role === 'student' && (
                <>
                  <Link to="/student" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <Briefcase size={18} /> Job Feed
                  </Link>
                  <Link to="/student/tracker" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <LayoutDashboard size={18} /> My Tracker
                  </Link>
                  <Link to="/student/profile" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <User size={18} /> Profile
                  </Link>
                  <Link to="/student/announcements" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">
                    <Megaphone size={18} /> Announcements
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center ml-3">
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 rounded-lg hover:text-red-600 hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
