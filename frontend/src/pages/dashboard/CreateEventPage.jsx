import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { eventAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Calendar, MapPin, Ticket, Globe } from 'lucide-react';

const CATEGORIES = ['music', 'tech', 'sports', 'art', 'food', 'business', 'health', 'education', 'comedy', 'other'];

const defaultTier = { name: '', price: 0, quantity: 100, description: '', maxPerUser: 5 };

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', shortDescription: '', description: '', category: 'tech',
    tags: '', banner: '',
    venue: { name: '', address: '', city: '', state: '', country: 'India', isOnline: false, onlineLink: '' },
    startDate: '', endDate: '',
    ticketTiers: [{ ...defaultTier, name: 'General', price: 499 }],
    refundPolicy: '24h', ageRestriction: 0, allowWaitlist: false,
  });

  const update = (path, value) => {
    const keys = path.split('.');
    setForm(prev => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addTier = () => setForm(f => ({ ...f, ticketTiers: [...f.ticketTiers, { ...defaultTier }] }));
  const removeTier = (i) => setForm(f => ({ ...f, ticketTiers: f.ticketTiers.filter((_, idx) => idx !== i) }));
  const updateTier = (i, field, val) => setForm(f => ({
    ...f,
    ticketTiers: f.ticketTiers.map((t, idx) => idx === i ? { ...t, [field]: val } : t),
  }));

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.startDate || !form.endDate || !form.venue.city) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: publish ? 'published' : 'draft',
      };
      const res = await eventAPI.create(payload);
      toast.success(publish ? '🎉 Event published!' : 'Event saved as draft');
      navigate(`/events/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white">Create New Event</h1>
        <p className="text-slate-400 text-sm">Fill in the details to create your event</p>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-white font-bold">Basic Information</h2>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Event Title *</label>
          <input value={form.title} onChange={e => update('title', e.target.value)} className="input-dark" placeholder="Enter event title" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Category *</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className="input-dark capitalize">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => update('tags', e.target.value)} className="input-dark" placeholder="react, nodejs, ai" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Short Description</label>
          <input value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} className="input-dark" placeholder="One line description (max 300 chars)" maxLength={300} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Full Description *</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} className="input-dark h-32 resize-none" placeholder="Detailed event description..." required />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Banner Image URL</label>
          <input value={form.banner} onChange={e => update('banner', e.target.value)} className="input-dark" placeholder="https://example.com/banner.jpg" type="url" />
          {form.banner && <img src={form.banner} alt="Banner preview" className="mt-2 h-32 w-full object-cover rounded-xl" onError={e => e.target.style.display='none'} />}
        </div>
      </div>

      {/* Date & Time */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary-400" size={18} />
          <h2 className="text-white font-bold">Date & Time</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Start Date & Time *</label>
            <input type="datetime-local" value={form.startDate} onChange={e => update('startDate', e.target.value)} className="input-dark" required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">End Date & Time *</label>
            <input type="datetime-local" value={form.endDate} onChange={e => update('endDate', e.target.value)} className="input-dark" required />
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-violet-400" size={18} />
            <h2 className="text-white font-bold">Venue</h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-400 text-sm">Online Event</span>
            <input type="checkbox" checked={form.venue.isOnline} onChange={e => update('venue.isOnline', e.target.checked)} className="rounded" />
          </label>
        </div>
        {form.venue.isOnline ? (
          <div>
            <label className="block text-sm text-slate-300 mb-2">Online Meeting Link</label>
            <input value={form.venue.onlineLink} onChange={e => update('venue.onlineLink', e.target.value)} className="input-dark" placeholder="https://zoom.us/..." type="url" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Venue Name *</label>
              <input value={form.venue.name} onChange={e => update('venue.name', e.target.value)} className="input-dark" placeholder="Convention Center" required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">City *</label>
              <input value={form.venue.city} onChange={e => update('venue.city', e.target.value)} className="input-dark" placeholder="Mumbai" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-300 mb-2">Full Address</label>
              <input value={form.venue.address} onChange={e => update('venue.address', e.target.value)} className="input-dark" placeholder="123 Main St, Andheri West" required />
            </div>
          </div>
        )}
      </div>

      {/* Ticket Tiers */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="text-emerald-400" size={18} />
            <h2 className="text-white font-bold">Ticket Tiers</h2>
          </div>
          <button type="button" onClick={addTier} className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors">
            <Plus size={14} /> Add Tier
          </button>
        </div>
        {form.ticketTiers.map((tier, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-400 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-medium text-sm">Tier {i + 1}</span>
              {form.ticketTiers.length > 1 && (
                <button type="button" onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300"><Minus size={14} /></button>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tier Name</label>
                <input value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} className="input-dark text-sm py-2" placeholder="VIP / General" required />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Price (₹) — 0 for free</label>
                <input type="number" value={tier.price} min={0} onChange={e => updateTier(i, 'price', Number(e.target.value))} className="input-dark text-sm py-2" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                <input type="number" value={tier.quantity} min={1} onChange={e => updateTier(i, 'quantity', Number(e.target.value))} className="input-dark text-sm py-2" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Settings */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-white font-bold">Event Settings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Refund Policy</label>
            <select value={form.refundPolicy} onChange={e => update('refundPolicy', e.target.value)} className="input-dark">
              <option value="no-refund">No Refund</option>
              <option value="24h">Refund within 24h</option>
              <option value="48h">Refund within 48h</option>
              <option value="7d">Refund within 7 days</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Minimum Age</label>
            <input type="number" value={form.ageRestriction} min={0} max={21} onChange={e => update('ageRestriction', Number(e.target.value))} className="input-dark" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button type="submit" disabled={loading} className="btn-secondary flex-1 py-4 disabled:opacity-50">
          Save as Draft
        </button>
        <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading}
          className="btn-primary flex-1 py-4 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>🚀 Publish Event</>}
        </button>
      </div>
    </form>
  );
};

export default CreateEventPage;
