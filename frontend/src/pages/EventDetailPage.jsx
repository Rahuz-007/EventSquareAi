import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, Users, Star, Share2, Heart,
  Ticket, ChevronRight, Shield, CheckCircle, X
} from 'lucide-react';
import { eventAPI, paymentAPI, aiAPI, userAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CATEGORY_EMOJI = { music: '🎵', tech: '💻', sports: '⚽', art: '🎨', food: '🍽️', business: '💼', health: '❤️', education: '📚', comedy: '😂' };

const BookingModal = ({ event, tier, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const available = tier.quantity - tier.sold;
  const total = tier.price * quantity;
  const finalTotal = Math.max(0, total - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await paymentAPI.validateCoupon({
        code: couponCode,
        eventId: event._id,
        totalAmount: total
      });
      setDiscount(res.data.discount);
      setCouponApplied(true);
      toast.success(`Coupon applied! Saved ₹${res.data.discount}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      setDiscount(0);
      setCouponApplied(false);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await paymentAPI.createOrder({ 
        eventId: event._id, 
        tierId: tier._id, 
        quantity,
        couponCode: couponApplied ? couponCode : undefined
      });
      const { orderId, bookingId, amount, key } = orderRes.data;

      if (tier.price === 0) {
        toast.success('Free ticket booked successfully!');
        onClose();
        navigate('/dashboard/bookings');
        return;
      }
      
      if (orderId.startsWith('demo_order_')) {
        toast.success('Demo mode: Simulating payment success...');
        await paymentAPI.verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: `demo_payment_${Date.now()}`,
          razorpay_signature: 'demo_signature_ok',
          bookingId,
        });
        toast.success('🎉 Demo Booking confirmed! Check your email/logs for tickets.');
        onClose();
        navigate('/dashboard/bookings');
        return;
      }

      // Load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay({
          key,
          amount,
          currency: 'INR',
          name: 'EventSphere AI',
          description: `${event.title} - ${tier.name}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              await paymentAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              });
              toast.success('🎉 Booking confirmed! Check your email for tickets.');
              onClose();
              navigate('/dashboard/bookings');
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {},
          theme: { color: '#6366f1' },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
        setLoading(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      toast.error(err.message || 'Booking failed');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-surface-400 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-lg">Book Tickets</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="glass-card p-4 mb-5">
          <p className="text-white font-semibold">{tier.name}</p>
          <p className="text-slate-400 text-sm">{tier.description || 'Standard entry ticket'}</p>
          <p className="text-primary-400 font-black text-xl mt-2">
            {tier.price === 0 ? 'FREE' : `₹${tier.price.toLocaleString('en-IN')}`}
          </p>
          <p className="text-slate-500 text-xs">{available} available</p>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-slate-300 font-medium">Quantity</span>
          <div className="flex items-center gap-3">
            <button onClick={() => {
                setQuantity(q => Math.max(1, q - 1));
                if (couponApplied) { setDiscount(0); setCouponApplied(false); }
              }}
              className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 font-bold">-</button>
            <span className="text-white font-bold w-8 text-center">{quantity}</span>
            <button onClick={() => {
                setQuantity(q => Math.min(Math.min(tier.maxPerUser, available), q + 1));
                if (couponApplied) { setDiscount(0); setCouponApplied(false); }
              }}
              className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 font-bold">+</button>
          </div>
        </div>

        {tier.price > 0 && (
          <div className="mb-5">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Coupon Code" 
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponApplied}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              />
              {couponApplied ? (
                <button onClick={() => { setDiscount(0); setCouponApplied(false); setCouponCode(''); }}
                  className="bg-red-500/20 text-red-400 px-3 rounded-lg text-sm font-medium hover:bg-red-500/30">
                  Remove
                </button>
              ) : (
                <button onClick={applyCoupon} disabled={validatingCoupon || !couponCode.trim()}
                  className="bg-primary-500 text-white px-3 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-600 transition-colors">
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              )}
            </div>
            {discount > 0 && (
              <p className="text-emerald-400 text-xs mt-2">Discount of ₹{discount.toLocaleString('en-IN')} applied</p>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-5 py-3 border-t border-b border-white/10">
          <span className="text-slate-400">Total Amount</span>
          <div className="text-right">
            {discount > 0 && <p className="text-slate-500 text-sm line-through">₹{total.toLocaleString('en-IN')}</p>}
            <p className="text-white font-black text-xl">{finalTotal === 0 ? 'FREE' : `₹${finalTotal.toLocaleString('en-IN')}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs mb-5">
          <Shield size={12} className="text-emerald-400" />
          <span>Secured by Razorpay. 100% safe payment.</span>
        </div>

        <button onClick={handleBook} disabled={loading || available === 0}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Ticket size={18} /> {finalTotal === 0 ? 'Get Free Ticket' : `Pay ₹${finalTotal.toLocaleString('en-IN')}`}</>}
        </button>
      </motion.div>
    </motion.div>
  );
};

const EventDetailPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [liked, setLiked] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getById(id);
        setEvent(res.data);
        if (isAuthenticated) {
          aiAPI.trackBehavior({ eventId: id, action: 'view' }).catch(() => {});
          const wlRes = await userAPI.getWishlist();
          if (wlRes.data?.some(e => e._id === id)) {
            setLiked(true);
          }
        }
      } catch {
        toast.error('Event not found');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, isAuthenticated]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const res = await userAPI.toggleWishlist(id);
      setLiked(res.isWishlisted);
      toast.success(res.isWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return <div className="min-h-screen bg-dark-400 flex items-center justify-center text-white">Event not found</div>;

  const eventDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-800/50 to-violet-800/50 flex items-center justify-center text-8xl">
            {CATEGORY_EMOJI[event.category] || '🎯'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 section-container">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="badge-primary capitalize">{event.category}</span>
            {event.featured && <span className="badge bg-amber-500/20 text-amber-400 border-amber-500/30">⭐ Featured</span>}
            <span className={`badge ${event.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white">{event.title}</h1>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info */}
            <div className="glass-card p-6">
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-slate-400 text-xs">Date & Time</p>
                    <p className="text-white font-medium">{eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-slate-400 text-sm">{eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-violet-400 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-slate-400 text-xs">Venue</p>
                    <p className="text-white font-medium">{event.venue?.name}</p>
                    <p className="text-slate-400 text-sm">{event.venue?.address}, {event.venue?.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-emerald-400 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-slate-400 text-xs">Capacity</p>
                    <p className="text-white font-medium">{event.totalSold}/{event.totalCapacity} booked</p>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500" style={{ width: `${(event.totalSold / event.totalCapacity) * 100}%` }} />
                    </div>
                  </div>
                </div>
                {event.rating?.count > 0 && (
                  <div className="flex items-start gap-3">
                    <Star className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-slate-400 text-xs">Rating</p>
                      <p className="text-white font-medium">{event.rating.average}/5.0</p>
                      <p className="text-slate-400 text-sm">{event.rating.count} reviews</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-white font-bold mb-3">About This Event</h2>
                <p className="text-slate-400 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs border border-white/10 text-slate-400">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer */}
            {event.organizer && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold mb-4">Organized By</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold">
                    {event.organizer.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{event.organizer.name}</p>
                    {event.organizer.organizerProfile?.companyName && (
                      <p className="text-slate-400 text-sm">{event.organizer.organizerProfile.companyName}</p>
                    )}
                    {event.organizer.organizerProfile?.verified && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 mt-0.5">
                        <CheckCircle size={12} /> Verified Organizer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Sidebar */}
          <div className="space-y-4">
            <div className="glass-card p-6 sticky top-4">
              <h2 className="text-white font-bold mb-4">Select Tickets</h2>
              <div className="space-y-3 mb-6">
                {event.availability?.map(tier => (
                  <motion.div
                    key={tier.tierId}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => tier.available > 0 && setSelectedTier(event.ticketTiers.id ? event.ticketTiers.find(t => t._id === tier.tierId) : event.ticketTiers.find(t => t._id?.toString() === tier.tierId?.toString()))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      tier.available === 0 ? 'opacity-50 cursor-not-allowed border-white/5' :
                      'border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{tier.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{tier.available} remaining</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-400 font-black">{tier.price === 0 ? 'FREE' : `₹${tier.price?.toLocaleString('en-IN')}`}</p>
                      </div>
                    </div>
                    {tier.available === 0 && <p className="text-red-400 text-xs mt-2">Sold Out</p>}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!event.availability?.some(t => t.available > 0)) return;
                  if (!selectedTier && event.ticketTiers?.length > 0) {
                    const firstAvailable = event.ticketTiers.find((_, i) => event.availability?.[i]?.available > 0);
                    setSelectedTier(firstAvailable);
                  }
                  setSelectedTier(s => s || event.ticketTiers?.[0]);
                }}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                disabled={!event.availability?.some(t => t.available > 0)}
              >
                <Ticket size={18} />
                {event.availability?.some(t => t.available > 0) ? 'Book Now' : 'Sold Out'}
              </button>

              <div className="flex items-center gap-2 text-slate-500 text-xs mt-3 justify-center">
                <Shield size={12} className="text-emerald-400" />
                <span>Secure payment via Razorpay</span>
              </div>
            </div>

            {/* Share */}
            <div className="glass-card p-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Share Event</span>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                  <Share2 size={15} />
                </button>
                <button onClick={toggleWishlist}
                  className={`p-2 rounded-lg border border-white/10 transition-colors ${liked ? 'text-red-400 border-red-500/30' : 'text-slate-400 hover:text-white'} hover:bg-white/5`}>
                  <Heart size={15} className={liked ? 'fill-current' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedTier && (
          <BookingModal event={event} tier={selectedTier} onClose={() => setSelectedTier(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailPage;
