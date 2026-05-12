import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, MapPin, Calendar, QrCode, Download, RefreshCw } from 'lucide-react';
import { userAPI, paymentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import toast from 'react-hot-toast';

const BookingCard = ({ booking }) => {
  const [showQR, setShowQR] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const statusColor = {
    confirmed: 'badge-success',
    pending: 'badge-warning',
    cancelled: 'badge-danger',
    refunded: 'badge-primary',
    'checked-in': 'badge-primary',
  };

  const handleRefund = async () => {
    if (!window.confirm('Request refund for this booking?')) return;
    setRefunding(true);
    try {
      await paymentAPI.requestRefund(booking._id, { reason: 'User request' });
      toast.success('Refund requested successfully');
    } catch (err) {
      toast.error(err.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  const qrData = JSON.stringify({
    bookingId: booking.bookingId,
    event: booking.event?._id,
    ticketNumber: booking.tickets?.[0]?.ticketNumber,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Event image */}
        <div className="sm:w-48 h-36 sm:h-auto relative flex-shrink-0">
          {booking.event?.banner ? (
            <img src={booking.event.banner} alt={booking.event?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-violet-600/30 flex items-center justify-center">
              <Ticket size={40} className="text-primary-400 opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-white font-bold text-base">{booking.event?.title}</h3>
              <p className="text-slate-500 text-xs mt-0.5">Booking #{booking.bookingId}</p>
            </div>
            <span className={statusColor[booking.status] || 'badge-primary'}>{booking.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{booking.event?.startDate ? new Date(booking.event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{booking.event?.venue?.city || '—'}</span>
            </div>
            <div className="text-slate-400 text-sm">
              <span className="text-slate-500">Tickets: </span>
              <span className="text-white font-medium">{booking.quantity}× {booking.ticketTier?.name}</span>
            </div>
            <div className="text-slate-400 text-sm">
              <span className="text-slate-500">Total: </span>
              <span className="text-emerald-400 font-bold">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {booking.status === 'confirmed' && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-primary-500/40 text-primary-400 hover:bg-primary-500/10 transition-all"
              >
                <QrCode size={12} /> {showQR ? 'Hide' : 'Show'} QR
              </button>
            )}
            {booking.status === 'confirmed' && booking.payment?.status === 'paid' && (
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={refunding ? 'animate-spin' : ''} />
                {refunding ? 'Processing...' : 'Request Refund'}
              </button>
            )}
          </div>

          {/* QR Code */}
          {showQR && booking.status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-white rounded-xl w-fit"
            >
              <QRCode value={qrData} size={140} level="H" />
              <p className="text-gray-700 text-xs text-center mt-2 font-medium">Present at venue</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    userAPI.getBookings()
      .then(res => setBookings(res.data || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen={false} />;

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Bookings</h1>
          <p className="text-slate-400 text-sm">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'confirmed', 'pending', 'cancelled', 'checked-in'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === s ? 'bg-primary-600 text-white' : 'text-slate-400 border border-white/10 hover:border-white/20'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Ticket size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-bold text-lg">No bookings found</h3>
          <p className="text-slate-400 mt-2">Browse events and book your first ticket!</p>
          <a href="/events" className="btn-primary inline-flex mt-4 text-sm py-2 px-6">Browse Events</a>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => <BookingCard key={booking._id} booking={booking} />)}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
