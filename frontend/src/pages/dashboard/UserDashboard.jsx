import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Sparkles, TrendingUp, Calendar, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiAPI, userAPI, eventAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserDashboard = () => {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recsRes, trendRes, bookRes] = await Promise.allSettled([
          aiAPI.getRecommendations(),
          aiAPI.getTrending(),
          userAPI.getBookings(),
        ]);
        if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data?.slice(0, 4) || []);
        if (trendRes.status === 'fulfilled') setTrending(trendRes.value.data?.slice(0, 3) || []);
        if (bookRes.status === 'fulfilled') setBookings(bookRes.value.data?.slice(0, 3) || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner fullScreen={false} />;

  const CATEGORY_EMOJI = { music: '🎵', tech: '💻', sports: '⚽', art: '🎨', food: '🍽️', business: '💼', health: '❤️', education: '📚', comedy: '😂', other: '🎯' };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-primary-600/10 to-violet-600/10 border border-primary-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-glow-primary">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-white font-black text-xl">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-slate-400 text-sm mt-1">
              {bookings.length > 0
                ? `You have ${bookings.length} upcoming event${bookings.length !== 1 ? 's' : ''}. Check your tickets below.`
                : 'Explore amazing events powered by AI recommendations just for you.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Ticket, label: 'Total Bookings', value: bookings.length, color: 'text-primary-400' },
          { icon: TrendingUp, label: 'Events Attended', value: bookings.filter(b => b.status === 'checked-in').length, color: 'text-emerald-400' },
          { icon: Star, label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-violet-400' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="glass-card p-5 text-center">
            <Icon size={22} className={`${color} mx-auto mb-2`} />
            <p className="text-white font-black text-xl">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary-400" />
            <h2 className="text-white font-bold">AI Picks For You</h2>
          </div>
          <Link to="/events" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.length === 0 ? (
            <div className="col-span-4 glass-card p-8 text-center">
              <Sparkles size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Book more events for personalized AI recommendations</p>
              <Link to="/events" className="btn-primary inline-flex mt-3 text-sm py-2 px-5">Explore Events</Link>
            </div>
          ) : recommendations.map(event => (
            <motion.div
              key={event._id}
              whileHover={{ y: -3 }}
              className="event-card"
            >
              <Link to={`/events/${event._id}`}>
                <div className="h-36 relative overflow-hidden">
                  {event.banner ? (
                    <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-violet-600/30 flex items-center justify-center text-5xl">
                      {CATEGORY_EMOJI[event.category] || '🎯'}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="badge-primary text-xs">{event.category}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">{event.title}</h3>
                  <p className="text-slate-500 text-xs mb-2">{event.venue?.city} • {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-primary-400 font-bold text-sm">
                    {event.isFree ? 'FREE' : `₹${event.minPrice?.toLocaleString('en-IN')}`}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      {bookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-violet-400" />
              <h2 className="text-white font-bold">Recent Bookings</h2>
            </div>
            <Link to="/dashboard/bookings" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking._id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{CATEGORY_EMOJI[booking.event?.category] || '🎯'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{booking.event?.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {booking.event?.startDate ? new Date(booking.event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} •{' '}
                    {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-emerald-400 font-bold text-sm">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`text-xs ${booking.status === 'confirmed' ? 'text-emerald-400' : booking.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-orange-400" />
              <h2 className="text-white font-bold">Trending Now</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {trending.map((event, i) => (
              <motion.div key={event._id} whileHover={{ y: -3 }} className="event-card">
                <Link to={`/events/${event._id}`}>
                  <div className="h-32 bg-gradient-to-br from-primary-600/20 to-violet-600/20 flex items-center justify-center text-4xl relative">
                    {event.banner
                      ? <img src={event.banner} alt={event.title} className="w-full h-full object-cover absolute inset-0" />
                      : CATEGORY_EMOJI[event.category] || '🎯'}
                    <div className="absolute top-2 left-2 badge bg-orange-500/20 text-orange-400 border-orange-500/30">
                      #{i + 1} Trending
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm line-clamp-1">{event.title}</h3>
                    <p className="text-slate-500 text-xs mt-1">{event.views?.toLocaleString()} views</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
