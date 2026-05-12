import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Ticket, Shield, BarChart3, QrCode, Zap,
  Globe, Users, TrendingUp, ArrowRight, Play, Star,
  ChevronDown, Menu, X, Bell
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const STATS = [
  { value: '500K+', label: 'Tickets Sold', icon: Ticket },
  { value: '12K+', label: 'Events Hosted', icon: Globe },
  { value: '98%', label: 'Satisfaction Rate', icon: Star },
  { value: '₹50Cr+', label: 'Revenue Processed', icon: TrendingUp },
];

const FEATURES = [
  { icon: Sparkles, title: 'AI Recommendations', desc: 'Personalized event suggestions powered by machine learning based on your preferences and behavior.', color: 'from-violet-500 to-purple-600' },
  { icon: Shield, title: 'Fraud Detection', desc: 'Real-time transaction monitoring with AI-powered fraud scoring to protect every booking.', color: 'from-emerald-500 to-teal-600' },
  { icon: QrCode, title: 'Smart QR Tickets', desc: 'Instant QR code generation for seamless contactless entry at any event venue.', color: 'from-blue-500 to-cyan-600' },
  { icon: BarChart3, title: 'Revenue Analytics', desc: 'Comprehensive dashboards with real-time KPIs, revenue trends, and audience insights.', color: 'from-orange-500 to-red-600' },
  { icon: Zap, title: 'Real-Time Notifications', desc: 'Instant Socket.io-powered updates for bookings, check-ins, and event changes.', color: 'from-yellow-500 to-orange-600' },
  { icon: Bell, title: 'Email Confirmations', desc: 'Beautiful branded email confirmations with ticket details delivered instantly.', color: 'from-pink-500 to-rose-600' },
];

const CATEGORIES = [
  { name: 'Music', emoji: '🎵', count: '1.2K Events' },
  { name: 'Tech', emoji: '💻', count: '890 Events' },
  { name: 'Sports', emoji: '⚽', count: '650 Events' },
  { name: 'Art', emoji: '🎨', count: '430 Events' },
  { name: 'Food', emoji: '🍽️', count: '320 Events' },
  { name: 'Business', emoji: '💼', count: '580 Events' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-dark-400/95 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">EventSphere AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/events" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Browse Events</Link>
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-sm py-2 px-5">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 py-4 flex flex-col gap-3"
            >
              <Link to="/events" className="text-slate-400 py-2 text-sm">Browse Events</Link>
              <Link to="/login" className="text-slate-400 py-2 text-sm">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm text-center py-2">Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/events?search=${encodeURIComponent(search)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background orbs */}
      <div className="orb orb-primary w-96 h-96 top-20 -left-20 animate-float" />
      <div className="orb orb-violet w-80 h-80 bottom-20 -right-10 animate-float" style={{ animationDelay: '2s' }} />
      <div className="orb orb-cyan w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="section-container relative z-10 text-center py-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-slate-300 font-medium">AI-Powered Event Platform</span>
          <Sparkles className="w-4 h-4 text-primary-400" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
        >
          Discover & Book
          <br />
          <span className="gradient-text">Extraordinary Events</span>
          <br />
          <span className="text-slate-400 text-4xl md:text-5xl">with AI Precision</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          EventSphere AI combines intelligent recommendations, secure Razorpay payments, 
          real-time analytics, and QR check-ins to deliver a world-class event experience.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSearch}
          className="flex items-center max-w-2xl mx-auto glass-card p-2 mb-8"
        >
          <input
            type="text"
            placeholder="Search events, artists, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 px-4 py-3 outline-none text-base"
          />
          <button type="submit" className="btn-primary py-3 px-6 flex items-center gap-2 whitespace-nowrap">
            <span>Explore</span>
            <ArrowRight size={16} />
          </button>
        </motion.form>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-4 px-8">
            <Sparkles size={18} /> Start Free Today
          </Link>
          <Link to="/events" className="btn-secondary flex items-center justify-center gap-2 text-base py-4 px-8">
            <Play size={16} className="fill-current" /> Watch Demo
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="glass-card p-6 text-center"
            >
              <Icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <div className="text-2xl font-black gradient-text">{value}</div>
              <div className="text-slate-500 text-sm mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
};

const FeaturesSection = () => (
  <section id="features" className="py-24 relative">
    <div className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="badge-primary mb-4">Platform Features</span>
        <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">
          Everything You Need to
          <span className="gradient-text"> Run Events</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          A complete SaaS solution for event organizers and attendees with enterprise-grade features.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CategoriesSection = () => (
  <section className="py-20 relative">
    <div className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
          Browse by <span className="gradient-text">Category</span>
        </h2>
        <p className="text-slate-400">Explore events tailored to your interests</p>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES.map(({ name, emoji, count }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.05 }}
            className="glass-card p-5 text-center cursor-pointer group hover:border-primary-500/40 transition-all duration-300"
            onClick={() => window.location.href = `/events?category=${name.toLowerCase()}`}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 block">{emoji}</div>
            <div className="font-semibold text-white text-sm">{name}</div>
            <div className="text-slate-500 text-xs mt-1">{count}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-24 relative overflow-hidden">
    <div className="orb orb-primary w-96 h-96 -top-20 left-1/4 opacity-20" />
    <div className="section-container relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-violet-600/10 rounded-2xl" />
        <div className="relative z-10">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ready to Transform Your
            <span className="gradient-text"> Events?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of organizers using EventSphere AI to create unforgettable experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-4 px-10">
              <Sparkles size={18} /> Start for Free
            </Link>
            <Link to="/events" className="btn-secondary flex items-center justify-center gap-2 text-base py-4 px-10">
              <Users size={18} /> Explore Events
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/5 py-12">
    <div className="section-container">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">EventSphere AI</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">The intelligent platform for discovering and managing extraordinary events.</p>
        </div>
        {[
          { title: 'Product', links: ['Browse Events', 'Create Event', 'Pricing', 'API Docs'] },
          { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
          { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="font-semibold text-white mb-4">{title}</h4>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link}><a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-600 text-sm">© 2025 EventSphere AI. All rights reserved.</p>
        <p className="text-slate-600 text-sm flex items-center gap-1">
          Built with <span className="text-red-500">♥</span> for amazing events
        </p>
      </div>
    </div>
  </footer>
);

const LandingPage = () => (
  <div className="min-h-screen bg-dark-400">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <CategoriesSection />
    <CTASection />
    <Footer />
  </div>
);

export default LandingPage;
