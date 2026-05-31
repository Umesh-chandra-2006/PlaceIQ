import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Briefcase, Users, Megaphone, BarChart3, 
  LogOut, CheckCircle, User, Sliders, Shield, Menu, X, Building, Bell,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);
  const isExpandedVisually = !isCollapsed || isHovered;

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/notifications');
      setNotifications(data);
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error("Error marking notification as read", e);
    }
  };

  const handleReadAll = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Error marking all read", e);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Determine navigation links based on user role
  let navLinks = [];
  let title = "PlaceIQ";
  let profilePath = "/";
  
  if (user?.role === 'student') {
    title = "PlaceIQ Student";
    profilePath = "/student/profile";
    navLinks = [
      { name: 'Job Feed', path: '/student', icon: Briefcase, exact: true },
      { name: 'Application Tracker', path: '/student/tracker', icon: CheckCircle },
      { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
      { name: 'My Profile', path: '/student/profile', icon: User },
    ];
  } else if (user?.role === 'coordinator') {
    title = "PlaceIQ Ops";
    profilePath = "/coordinator/profile";
    navLinks = [
      { name: 'Overview', path: '/coordinator', icon: LayoutDashboard, exact: true },
      { name: 'Jobs & Listings', path: '/coordinator/jobs', icon: Briefcase },
      { name: 'Student Directory', path: '/coordinator/students', icon: Users },
      { name: 'Companies CRM', path: '/coordinator/companies', icon: Building },
      { name: 'Announcements', path: '/coordinator/announcements', icon: Megaphone },
      { name: 'My Profile', path: '/coordinator/profile', icon: User },
    ];
    if (user?.subRole === 'coordinator_paid') {
      navLinks.push({ name: 'Analytics', path: '/coordinator/analytics', icon: BarChart3 });
    }
  } else if (user?.role === 'admin') {
    title = "PlaceIQ Admin";
    profilePath = "/admin/settings";
    navLinks = [
      { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
      { name: 'College Settings', path: '/admin/settings', icon: Sliders },
      { name: 'Coordinators', path: '/admin/coordinators', icon: Users },
    ];
  } else if (user?.role === 'superadmin') {
    title = "PlaceIQ Super";
    profilePath = "/admin";
    navLinks = [
      { name: 'Colleges', path: '/admin', icon: Shield, exact: true },
    ];
  }

  return (
    <>
      {/* Floating Toggle Trigger Button — visible only on mobile */}
      <div className="md:hidden fixed top-3.5 left-3.5 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-zinc-100 transition-colors shadow-lg hover:bg-zinc-850"
          title="Toggle Menu"
        >
          {isOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        
        {/* Floating Bell on mobile */}
        {user && (
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-zinc-100 transition-colors shadow-lg hover:bg-zinc-850 relative"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Backdrop overlay behind sidebar on mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-20 animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 bg-zinc-950/70 border-r border-zinc-800 flex flex-col text-zinc-300 z-20 transition-all duration-300 ease-out md:translate-x-0 md:m-4 md:h-[calc(100vh-2rem)] md:rounded-2xl md:border md:bg-zinc-950/70 md:backdrop-blur-md md:shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isExpandedVisually ? 'md:w-64 w-64' : 'w-20'}`}>
        <div className={`p-4 border-b border-zinc-800 flex items-center ${isExpandedVisually ? 'justify-between' : 'flex-col gap-3 justify-center'}`}>
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-zinc-950" />
            </div>
            {isExpandedVisually && <span className="font-bold text-zinc-100 tracking-tight">{title}</span>}
          </Link>
          
          <div className={`flex items-center ${isExpandedVisually ? 'gap-2' : 'flex-col gap-2.5'}`}>
            {/* Bell button on desktop side */}
            {user && (
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors hidden md:block"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-550 rounded-full animate-pulse" />
                )}
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {isExpandedVisually && <div className="px-3 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Workspace</div>}
          <nav className="space-y-1.5 px-2">
            {navLinks.map((link) => {
              const isActive = link.exact 
                ? (location.pathname === link.path || location.pathname === link.path + '/') 
                : location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center rounded text-sm transition-all duration-200 ${
                    isExpandedVisually ? 'gap-2 px-2 py-1.5' : 'justify-center p-2 mx-auto w-10 h-10'
                  } ${
                    isActive 
                      ? 'bg-zinc-800/50 text-zinc-100 font-medium' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                  title={!isExpandedVisually ? link.name : ""}
                >
                  <Icon size={16} className={isActive ? 'text-primary-500' : 'text-zinc-500'} />
                  {isExpandedVisually && <span>{link.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 flex flex-col items-center gap-3 w-full">
          {/* User profile link details */}
          {isExpandedVisually ? (
            <Link 
              to={profilePath}
              className="flex items-center justify-between mb-1 px-2 py-1.5 w-full hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer text-left"
            >
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-sm font-medium text-zinc-200 truncate">{user?.name}</span>
                <span className="text-[10px] font-mono text-zinc-500 truncate" title={user?.email}>{user?.email}</span>
                {user?.role !== 'student' && (
                  <span className="text-[9px] font-mono text-indigo-400 mt-1 uppercase tracking-widest">
                    {user?.role === 'superadmin' ? 'superadmin' : user?.subRole ? user?.subRole.replace('_', ' ') : user?.role}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link 
              to={profilePath}
              className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-primary-500 border border-zinc-800 hover:bg-zinc-800 hover:border-primary-500/50 transition-all cursor-pointer"
              title={`View Profile: ${user?.name} (${user?.email})`}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Link>
          )}

          {/* Collapse toggle button on desktop */}
          {user && (
            <button 
              onClick={toggleCollapse}
              className={`w-full hidden md:flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900 rounded transition-colors ${
                isExpandedVisually ? 'justify-start' : 'justify-center p-2 w-10 h-10 mx-auto'
              }`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              {isExpandedVisually && <span>Collapse Sidebar</span>}
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors ${
              isExpandedVisually ? 'justify-start' : 'justify-center p-2 w-10 h-10 mx-auto'
            }`}
            title="Sign out"
          >
            <LogOut size={16} /> 
            {isExpandedVisually && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Notifications Panel Overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-40 flex justify-end md:justify-start md:pl-64 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowNotifications(false)} />
          
          {/* Panel */}
          <div className="relative w-full max-w-sm h-full bg-zinc-950 border-r border-zinc-850 flex flex-col z-10 shadow-2xl animate-slideOver font-sans text-zinc-100">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary-500" />
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleReadAll}
                    className="text-[10px] text-zinc-450 hover:text-zinc-250 transition-colors uppercase font-mono tracking-wider font-semibold"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/40 select-text">
              {loadingNotifications ? (
                <div className="text-center py-12 text-zinc-550 text-xs font-mono">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 text-zinc-550 text-xs font-mono flex flex-col items-center justify-center gap-2">
                  <CheckCircle size={20} className="text-zinc-700" />
                  <span>You're all caught up!</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id} 
                    className={`p-3 rounded-lg border text-xs relative group transition-colors ${
                      n.isRead 
                        ? 'bg-zinc-905/30 border-zinc-900 text-zinc-450' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-semibold text-zinc-100">{n.title}</span>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-[10px] text-primary-500 hover:text-primary-400 transition-colors font-semibold"
                        >
                          Read
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed font-sans">{n.message}</p>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1.5">
                      {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
