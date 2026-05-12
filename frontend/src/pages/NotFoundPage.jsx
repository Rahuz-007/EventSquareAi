import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-400 flex items-center justify-center p-4">
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-8xl mb-6"
      >
        🎭
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-6xl font-black gradient-text mb-4"
      >
        404
      </motion.h1>
      <p className="text-white text-2xl font-bold mb-3">Page Not Found</p>
      <p className="text-slate-400 mb-8">The event you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/" className="btn-primary flex items-center gap-2">
          <Home size={16} /> Go Home
        </Link>
        <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
