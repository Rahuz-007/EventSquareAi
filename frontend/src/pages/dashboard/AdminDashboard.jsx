import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, AlertTriangle, BarChart3, Shield, Globe } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/30 text-primary-400',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  };
  return (
    <motion.div whileHover={{ y: -2 }} className={`glass-card p-6 border bg-gradient-to-br ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-black">{value}</p>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} />;

  const monthlyData = stats?.monthlyRevenue?.map(m => ({
    month: MONTHS[m._id.month - 1],
    revenue: m.revenue,
    bookings: m.bookings,
  })) || [];

  const categoryData = stats?.categoryStats?.map(c => ({
    name: c._id,
    value: c.count,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide analytics and management</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-dark py-2 text-sm w-auto"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={fetchStats} className="btn-primary py-2 px-4 text-sm">Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.kpis?.totalUsers?.toLocaleString() || '0'} trend={12} color="primary" />
        <StatCard icon={Calendar} label="Total Events" value={stats?.kpis?.totalEvents?.toLocaleString() || '0'} trend={8} color="violet" />
        <StatCard icon={TrendingUp} label="Confirmed Bookings" value={stats?.kpis?.totalBookings?.toLocaleString() || '0'} trend={15} color="emerald" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${((stats?.kpis?.totalRevenue || 0) / 100000).toFixed(1)}L`} trend={22} color="orange" />
        <StatCard icon={AlertTriangle} label="Flagged Bookings" value={stats?.kpis?.flaggedBookings || '0'} trend={-5} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-bold">Revenue & Bookings</h3>
              <p className="text-slate-400 text-xs">Monthly performance overview</p>
            </div>
            <BarChart3 className="text-primary-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="Revenue (₹)" />
              <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} fill="url(#bookGrad)" name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="chart-container">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-bold">Events by Category</h3>
              <p className="text-slate-400 text-xs">Distribution overview</p>
            </div>
            <Globe className="text-violet-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                  <span className="text-slate-400 text-xs capitalize">{c.name}</span>
                </div>
                <span className="text-white text-xs font-semibold">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-bold">Recent Bookings</h3>
          <p className="text-slate-400 text-xs mt-1">Latest confirmed transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentBookings?.map(b => (
                <tr key={b._id} className="hover:bg-white/2 transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {b.user?.name?.charAt(0)}
                      </div>
                      <span className="text-white text-sm">{b.user?.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-300 max-w-xs truncate">{b.event?.title}</td>
                  <td className="text-emerald-400 font-semibold">₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                  <td><span className="badge-success">{b.status}</span></td>
                  <td className="text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                <tr><td colSpan={5} className="text-center text-slate-500 py-8">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fraud Alert */}
      {stats?.kpis?.flaggedBookings > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 border border-red-500/30 bg-red-500/5"
        >
          <div className="flex items-center gap-3">
            <Shield className="text-red-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Fraud Alert</p>
              <p className="text-slate-400 text-xs">{stats.kpis.flaggedBookings} booking(s) flagged for suspicious activity. Review in the fraud management section.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
