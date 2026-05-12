import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Users, Plus, Eye } from 'lucide-react';
import { organizerAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OrganizerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizerAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen={false} />;

  const monthlyData = stats?.monthlyRevenue?.map(m => ({
    month: MONTHS[m._id.month - 1],
    revenue: m.revenue,
    bookings: m.bookings,
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Organizer Hub</h1>
          <p className="text-slate-400 text-sm">Manage your events and track performance</p>
        </div>
        <Link to="/dashboard/create-event" className="btn-primary flex items-center gap-2 text-sm py-2 px-5">
          <Plus size={16} /> Create Event
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: 'Total Events', value: stats?.kpis?.totalEvents || 0, color: 'text-primary-400' },
          { icon: Users, label: 'Total Bookings', value: stats?.kpis?.totalBookings || 0, color: 'text-violet-400' },
          { icon: DollarSign, label: 'Total Revenue', value: `₹${((stats?.kpis?.totalRevenue || 0) / 1000).toFixed(1)}K`, color: 'text-emerald-400' },
          { icon: TrendingUp, label: 'Upcoming Events', value: stats?.kpis?.upcomingEvents || 0, color: 'text-orange-400' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="glass-card p-6">
            <Icon size={22} className={`${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-white text-2xl font-black mt-1">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="chart-container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-white font-bold">Monthly Revenue</h3>
            <p className="text-slate-400 text-xs">Last 6 months performance</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="orgRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#orgRevGrad)" name="Revenue (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Event Performance Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold">Event Performance</h3>
            <p className="text-slate-400 text-xs">Revenue and ticket sales by event</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Tickets Sold</th>
                <th>Revenue</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.eventRevenue?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="text-slate-500">
                      <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No events yet</p>
                      <Link to="/dashboard/create-event" className="text-primary-400 text-sm mt-2 inline-block hover:text-primary-300">Create your first event →</Link>
                    </div>
                  </td>
                </tr>
              )}
              {stats?.eventRevenue?.map(e => (
                <tr key={e._id}>
                  <td className="font-medium text-white max-w-xs truncate">{e.event?.title}</td>
                  <td><span className={`badge ${e.event?.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{e.event?.status}</span></td>
                  <td className="text-violet-400 font-semibold">{e.tickets}</td>
                  <td className="text-emerald-400 font-semibold">₹{e.revenue?.toLocaleString('en-IN')}</td>
                  <td className="text-slate-500">{e.event?.startDate ? new Date(e.event.startDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <Link to={`/events/${e._id}`} className="text-primary-400 hover:text-primary-300 p-1 rounded transition-colors">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
