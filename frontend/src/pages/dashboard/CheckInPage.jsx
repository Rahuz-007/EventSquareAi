import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle, XCircle, Camera, Loader } from 'lucide-react';
import { organizerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CheckInPage = () => {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheckIn = async () => {
    if (!qrInput.trim()) { toast.error('Please enter QR data'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await organizerAPI.checkIn({ qrData: qrInput });
      setResult({ success: true, data: res.data });
      toast.success(`✅ ${res.data.attendee} checked in!`);
      setQrInput('');
    } catch (err) {
      setResult({ success: false, error: err.message || 'Check-in failed' });
      toast.error(err.message || 'Invalid QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">QR Check-In System</h1>
        <p className="text-slate-400 text-sm">Scan or paste attendee QR code data to check them in</p>
      </div>

      {/* Scanner card */}
      <div className="glass-card p-8 text-center">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
          <QrCode size={48} className="text-primary-400" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Attendee Check-In</h2>
        <p className="text-slate-400 text-sm mb-6">Paste the QR code data from an attendee's ticket</p>

        <textarea
          value={qrInput}
          onChange={e => setQrInput(e.target.value)}
          placeholder='Paste QR data here: {"bookingId":"EVS-XXXX","ticketNumber":"TKT-XXXX",...}'
          className="input-dark h-28 resize-none text-sm font-mono mb-4"
        />

        <button
          onClick={handleCheckIn}
          disabled={loading || !qrInput.trim()}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader size={18} className="animate-spin" /> Verifying...</>
          ) : (
            <><CheckCircle size={18} /> Check In Attendee</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-card p-6 border ${result.success ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}
        >
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle size={40} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle size={40} className="text-red-400 flex-shrink-0" />
            )}
            <div>
              <h3 className={`font-bold text-lg ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.success ? '✅ Check-In Successful!' : '❌ Check-In Failed'}
              </h3>
              {result.success ? (
                <div className="mt-2 space-y-1">
                  <p className="text-white font-semibold">{result.data.attendee}</p>
                  <p className="text-slate-400 text-sm">Event: {result.data.event}</p>
                  <p className="text-slate-400 text-sm">Booking: {result.data.booking?.bookingId}</p>
                  <p className="text-emerald-400 text-sm">Checked in at {new Date().toLocaleTimeString()}</p>
                </div>
              ) : (
                <p className="text-slate-400 mt-1">{result.error}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="glass-card p-6">
        <h3 className="text-white font-bold mb-4">How to Check In Attendees</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Attendee shows QR code from their booking confirmation email or app' },
            { step: '2', text: 'Scan QR code with a scanner app or ask attendee to share the QR data' },
            { step: '3', text: 'Paste the QR data in the text box above and click Check In' },
            { step: '4', text: 'System verifies the ticket and marks it as checked in' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
              <p className="text-slate-400 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
