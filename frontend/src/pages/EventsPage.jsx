import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Calendar, Star, SlidersHorizontal, X } from 'lucide-react';
import { eventAPI, aiAPI } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CATEGORIES = ['all', 'music', 'tech', 'sports', 'art', 'food', 'business', 'health', 'education', 'comedy'];
const CATEGORY_EMOJI = { music: '🎵', tech: '💻', sports: '⚽', art: '🎨', food: '🍽️', business: '💼', health: '❤️', education: '📚', comedy: '😂', other: '🎯' };

const EventCard = ({ event }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ duration: 0.2 }}
    className="event-card"
  >
    <Link to={`/events/${event._id}`}>
      <div className="relative h-48 overflow-hidden">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-violet-600/30 flex items-center justify-center text-6xl">
            {CATEGORY_EMOJI[event.category] || '🎯'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-400/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge-primary capitalize">{event.category}</span>
          {event.featured && <span className="badge bg-amber-500/20 text-amber-400 border-amber-500/30">⭐ Featured</span>}
        </div>
        {event.isFree && (
          <div className="absolute top-3 right-3 badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-white font-bold text-base mb-2 line-clamp-2 leading-snug">{event.title}</h3>
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar size={13} className="flex-shrink-0" />
            <span>{new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{event.venue?.name}, {event.venue?.city}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {event.isFree ? (
              <span className="text-emerald-400 font-black text-lg">FREE</span>
            ) : (
              <span className="text-white font-black text-lg">
                ₹{event.minPrice?.toLocaleString('en-IN')}
                {event.maxPrice > event.minPrice && <span className="text-slate-500 text-xs font-normal"> onwards</span>}
              </span>
            )}
          </div>
          {event.rating?.count > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <Star size={13} className="fill-current" />
              <span className="font-semibold">{event.rating.average}</span>
              <span className="text-slate-500">({event.rating.count})</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {event.totalSold > 0 && `${event.totalSold} booked`}
          </div>
          {event.totalCapacity > 0 && (
            <div className="text-xs text-slate-500">
              {event.totalCapacity - event.totalSold} left
            </div>
          )}
        </div>
        {/* Capacity bar */}
        {event.totalCapacity > 0 && (
          <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500"
              style={{ width: `${Math.min((event.totalSold / event.totalCapacity) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  </motion.div>
);

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: '-startDate',
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await eventAPI.getAll(params);
      setEvents(res.data || []);
      setPagination(res.pagination || {});
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Header */}
      <div className="bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 pt-20 pb-8">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Discover Events</h1>
          <p className="text-slate-400 mb-6">Find the perfect event for you — powered by AI</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center glass-card p-2 max-w-2xl mb-4">
            <Search className="text-slate-500 ml-3 flex-shrink-0" size={18} />
            <input
              type="text"
              placeholder="Search events, venues, artists..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="flex-1 bg-transparent text-white placeholder-slate-500 px-3 py-2 outline-none text-sm"
            />
            {filters.search && (
              <button type="button" onClick={() => setFilters(f => ({ ...f, search: '' }))} className="text-slate-500 hover:text-white mr-1">
                <X size={16} />
              </button>
            )}
            <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
          </form>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilters(f => ({ ...f, category: cat === 'all' ? '' : cat, page: 1 }))}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${
                  (cat === 'all' && !filters.category) || filters.category === cat
                    ? 'bg-primary-600 text-white shadow-glow-primary'
                    : 'glass-card text-slate-400 hover:text-white border-transparent'
                }`}
              >
                {cat === 'all' ? '✨ All' : `${CATEGORY_EMOJI[cat]} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading...' : `${pagination.total || 0} events found`}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="input-dark py-2 text-sm w-auto"
            >
              <option value="-startDate">Upcoming First</option>
              <option value="-views">Most Popular</option>
              <option value="minPrice">Price: Low to High</option>
              <option value="-minPrice">Price: High to Low</option>
              <option value="-rating.average">Top Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="h-48 shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                  <div className="h-6 shimmer rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-white font-bold text-xl mb-2">No events found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
            <button onClick={() => setFilters({ search: '', category: '', city: '', minPrice: '', maxPrice: '', sort: '-startDate', page: 1 })}
              className="btn-secondary mt-4 text-sm">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map(event => <EventCard key={event._id} event={event} />)}
            </div>
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      filters.page === i + 1 ? 'bg-primary-600 text-white' : 'glass-card text-slate-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
