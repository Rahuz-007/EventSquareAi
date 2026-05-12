import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = true }) => {
  if (!fullScreen) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-t-primary-500 border-r-violet-500 rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="text-center">
          <h3 className="gradient-text font-bold text-xl">EventSphere AI</h3>
          <p className="text-slate-500 text-sm mt-1">Loading...</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
