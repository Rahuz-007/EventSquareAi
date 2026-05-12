import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Ticket, Calendar, BarChart3, Settings,
  LogOut, Sparkles, Bell, Menu, X, Users, Shield, QrCode,
  Plus, ChevronDown, TrendingUp, Home
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const NAV_ITEMS = {
  user: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/bookings', label: 'My Bookings', icon: Ticket },
    { path: '/events', label: 'Browse Events', icon: Calendar, external: true },
    { path: '/dashboard/profile', label: 'Profile', icon: Settings },
  ],
  organizer: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/organizer', label: 'Organizer Hub', icon: TrendingUp },
    { path: '/dashboard/create-event', label: 'Create Event', icon: Plus },
    { path: '/dashboard/bookings', label: 'My Bookings', icon: Ticket },
    { path: '/dashboard/checkin', label: 'QR Check-in', icon: QrCode },
    { path: '/events', label: 'Browse Events', icon: Calendar, external: true },
    { path: '/dashboard/profile', label: 'Profile', icon: Settings },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
    { path: '/dashboard/organizer', label: 'Organizer Hub', icon: TrendingUp },
    { path: '/dashboard/create-event', label: 'Create Event', icon: Plus },
    { path: '/dashboard/bookings', label: 'Bookings', icon: Ticket },
    { path: '/dashboard/checkin', label: 'QR Check-in', icon: QrCode },
    { path: '/dashboard/profile', label: 'Profile', icon: Settings },
  ],
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.user;

  useEffect(() => {
    fetchNotifications();
    // Socket.io connection
    const socket = io(SOCKET_URL);
    socket.on('connect', () => socket.emit('authenticate', user?._id));
    socket.on('booking_confirmed', () => {
      fetchNotifications();
      toast.success('Booking confirmed!');
    });
    socket.on('broadcast', ({ title, message }) => {
      toast(message, { icon: '📢' });
      fetchNotifications();
    });
    return () => socket.disconnect();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await userAPI.getNotifications();
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {}
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-6'}`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow-primary flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg gradient-text">EventSphere AI</span>
      </Link>

      {/* User info */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
            <p className="text-xs text-primary-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, label, icon: Icon, external }) => (
          <Link
            key={path}
            to={path}
            target={external ? '_self' : undefined}
            onClick={() => { if (mobile) setSidebarOpen(false); }}
            className={`sidebar-item ${isActive({ path, exact: path === '/dashboard' }) ? 'active' : ''}`}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
            {label === 'Create Event' && (
              <span className="ml-auto w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">+</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 mt-4"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-400 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-surface-400 border-r border-white/5">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-400 border-r border-white/5 lg:hidden"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-dark-400/90 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-white font-semibold text-sm">
                {navItems.find(n => isActive(n))?.label || 'Dashboard'}
              </h1>
              <p className="text-slate-600 text-xs hidden sm:block">EventSphere AI Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 glass-card shadow-card z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-semibold text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={async () => { await userAPI.markAllRead(); fetchNotifications(); }}
                          className="text-xs text-primary-400 hover:text-primary-300">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No notifications</p>
                      ) : notifications.slice(0, 5).map(n => (
                        <div key={n._id} className={`p-4 border-b border-white/5 hover:bg-white/3 transition-colors ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                          <p className="text-white text-sm font-medium">{n.title}</p>
                          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-slate-600 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home link */}
            <Link to="/" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Home size={18} />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
