require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// We need to load models after dotenv
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Notification = require('./src/models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventsphere';

const events = [
  {
    title: 'ReactConf India 2025',
    shortDescription: 'The biggest React.js conference in India with speakers from Meta, Google, and top startups.',
    description: `Join 2,000+ developers at ReactConf India — the premier React.js conference in South Asia!\n\nHighlights:\n• 20+ speakers from Meta, Google, Razorpay & top startups\n• Workshops on React 19, Next.js 15, and AI integration\n• Networking lunch and after-party\n• Exclusive swag bag and certificate\n\nDon't miss the biggest React event of the year!`,
    category: 'tech',
    tags: ['react', 'javascript', 'frontend', 'web'],
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    venue: { name: 'Bangalore International Exhibition Centre', address: '10th Mile, Tumkur Road', city: 'Bangalore', state: 'Karnataka', country: 'India', isOnline: false },
    startDate: new Date('2025-06-15T09:00:00'),
    endDate: new Date('2025-06-15T18:00:00'),
    ticketTiers: [
      { name: 'General', price: 999, quantity: 500, sold: 312, maxPerUser: 5, description: 'General entry with lunch and swag' },
      { name: 'VIP', price: 2499, quantity: 100, sold: 45, maxPerUser: 3, description: 'VIP seating, speaker access, exclusive dinner' },
      { name: 'Workshop Pass', price: 1499, quantity: 150, sold: 89, maxPerUser: 2, description: 'Full day workshop + conference access' },
    ],
    status: 'published',
    featured: true,
    rating: { average: 4.8, count: 124 },
    refundPolicy: '48h',
  },
  {
    title: 'Sunburn Mumbai 2025',
    shortDescription: 'Asia\'s biggest electronic music festival returns to Mumbai with 50+ DJs.',
    description: `SUNBURN MUMBAI is back! Asia's most iconic music festival brings you 3 days of non-stop music, art, and culture.\n\n🎵 50+ International & Indian DJs\n🌅 Sunrise to Sunset sets\n🍔 30+ Food Stalls & Bars\n🎨 Art Installations & Experiences\n\nLine-up includes: Martin Garrix, Nucleya, Ritviz, Arjun Vagale and more!\n\nThis is the event of the year — don't miss out!`,
    category: 'music',
    tags: ['edm', 'festival', 'music', 'dance', 'sunburn'],
    banner: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    venue: { name: 'Mahalaxmi Race Course', address: 'Mahalaxmi', city: 'Mumbai', state: 'Maharashtra', country: 'India', isOnline: false },
    startDate: new Date('2025-07-04T16:00:00'),
    endDate: new Date('2025-07-06T23:59:00'),
    ticketTiers: [
      { name: 'Day Pass', price: 1999, quantity: 2000, sold: 1456, maxPerUser: 4, description: 'Single day entry' },
      { name: '3-Day Pass', price: 4999, quantity: 500, sold: 378, maxPerUser: 2, description: 'Full festival access' },
      { name: 'Platinum', price: 9999, quantity: 50, sold: 32, maxPerUser: 1, description: 'VIP lounge, backstage access, meet & greet' },
    ],
    status: 'published',
    featured: true,
    rating: { average: 4.9, count: 445 },
    refundPolicy: '24h',
  },
  {
    title: 'IPL Watch Party - CSK vs MI',
    shortDescription: 'Watch the epic Chennai Super Kings vs Mumbai Indians clash on a massive 60ft LED screen!',
    description: `The ultimate IPL Watch Party — CSK vs MI!\n\n🏏 60ft LED Screen\n🍺 Unlimited Beer, Snacks & BBQ\n🎤 Live Commentary & DJ\n🏆 Match Prediction Contest with ₹50,000 prize pool\n\nJoin 500+ cricket fans for the most electric atmosphere in Chennai. All tickets include unlimited food & drinks for 4 hours.`,
    category: 'sports',
    tags: ['cricket', 'ipl', 'csk', 'mi', 'sports'],
    banner: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
    venue: { name: 'Phoenix Marketcity Rooftop', address: '142, Velachery Main Road', city: 'Chennai', state: 'Tamil Nadu', country: 'India', isOnline: false },
    startDate: new Date('2025-06-20T18:30:00'),
    endDate: new Date('2025-06-20T23:00:00'),
    ticketTiers: [
      { name: 'Standard', price: 799, quantity: 300, sold: 211, maxPerUser: 10, description: 'Entry with food & drinks package' },
      { name: 'Premium Table', price: 1999, quantity: 50, sold: 38, maxPerUser: 6, description: 'Reserved table for 6, premium service' },
    ],
    status: 'published',
    rating: { average: 4.6, count: 87 },
    refundPolicy: '24h',
  },
  {
    title: 'Art & Soul Exhibition: The Future of Generative AI Art',
    shortDescription: 'Explore 200+ AI-generated artworks from 50 global artists at this groundbreaking exhibition.',
    description: `Welcome to the future of creativity.\n\nArt & Soul brings together 50 pioneering artists who use AI as their canvas. Experience:\n\n🖼️ 200+ Unique AI Artworks\n🤖 Live AI Art Generation Demos\n💬 Artist Talks & Panel Discussions\n🛒 Art Sale — Originals & Prints\n📸 Immersive Photo Experiences\n\nFree entry! Open to all ages.`,
    category: 'art',
    tags: ['art', 'ai', 'exhibition', 'creative', 'design'],
    banner: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&q=80',
    venue: { name: 'National Gallery of Modern Art', address: 'Jaipur House, India Gate', city: 'Delhi', state: 'Delhi', country: 'India', isOnline: false },
    startDate: new Date('2025-07-10T10:00:00'),
    endDate: new Date('2025-07-20T20:00:00'),
    ticketTiers: [
      { name: 'Free Entry', price: 0, quantity: 5000, sold: 1234, maxPerUser: 10, description: 'Open access - register for free' },
    ],
    status: 'published',
    featured: true,
    isFree: true,
    rating: { average: 4.7, count: 203 },
    refundPolicy: 'no-refund',
  },
  {
    title: 'The Great India Food Festival',
    shortDescription: '100+ chefs, 30+ cuisines, 1 epic festival — India\'s biggest food carnival in Hyderabad.',
    description: `TIGFF is back for its 5th edition — bigger, tastier, and more spectacular than ever!\n\n🍜 100+ Renowned Chefs\n🌍 30+ Cuisines from across India\n🍰 Dessert Village\n🍸 Craft Cocktails & Mocktails\n🎵 Live Music & Entertainment\n👨‍🍳 Celebrity Chef Cook-offs\n\nA 3-day celebration of India's incredible culinary heritage.`,
    category: 'food',
    tags: ['food', 'festival', 'chef', 'cuisine', 'hyderabad'],
    banner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    venue: { name: 'HICC Convention Centre', address: 'Novotel, HICC Complex', city: 'Hyderabad', state: 'Telangana', country: 'India', isOnline: false },
    startDate: new Date('2025-08-01T11:00:00'),
    endDate: new Date('2025-08-03T22:00:00'),
    ticketTiers: [
      { name: 'Day Pass', price: 599, quantity: 1000, sold: 456, maxPerUser: 5, description: 'Entry + 5 tasting tokens' },
      { name: 'Weekend Bundle', price: 1299, quantity: 300, sold: 178, maxPerUser: 3, description: '3 days + 20 tasting tokens + chef interaction' },
    ],
    status: 'published',
    rating: { average: 4.5, count: 312 },
    refundPolicy: '48h',
  },
  {
    title: 'Startup Funding Summit — Pitch to Top 50 VCs',
    shortDescription: 'Pitch your startup to India\'s top 50 VCs and angel investors. ₹10Cr funding pool on the table.',
    description: `The most impactful startup event of 2025.\n\n💰 ₹10 Crore Funding Pool\n🏆 50 Top VCs & Angel Investors\n🎤 Pitch Competition (apply separately)\n📊 Masterclasses on Fundraising, GTM & Scaling\n🤝 1-on-1 Investor Networking\n\nSpeakers: Founders of Zomato, CRED, Razorpay, Groww and more.\n\nApply to pitch or attend as a delegate.`,
    category: 'business',
    tags: ['startup', 'venture capital', 'funding', 'entrepreneurship', 'pitch'],
    banner: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
    venue: { name: 'Jio World Convention Centre', address: 'G Block, BKC', city: 'Mumbai', state: 'Maharashtra', country: 'India', isOnline: false },
    startDate: new Date('2025-09-05T09:00:00'),
    endDate: new Date('2025-09-06T18:00:00'),
    ticketTiers: [
      { name: 'Delegate', price: 3999, quantity: 500, sold: 234, maxPerUser: 2, description: 'Full access to all sessions & networking' },
      { name: 'Startup Founder', price: 1999, quantity: 200, sold: 156, maxPerUser: 2, description: 'Special rate for founders' },
      { name: 'Investor Pass', price: 0, quantity: 100, sold: 67, maxPerUser: 1, description: 'Complimentary for verified investors' },
    ],
    status: 'published',
    featured: true,
    rating: { average: 4.8, count: 189 },
    refundPolicy: '7d',
  },
  {
    title: 'Yoga & Wellness Retreat — Rishikesh',
    shortDescription: 'A transformative 3-day retreat by the Ganges with world-class yoga instructors and meditation.',
    description: `Escape the chaos. Find your peace.\n\nJoin us for a 3-day immersive wellness retreat in the yoga capital of the world — Rishikesh.\n\n🧘 Morning & Evening Yoga Sessions\n🌿 Ayurvedic Spa & Massage\n🍃 Sattvic Nutrition Workshop\n🌅 Sunrise Meditation by Ganges\n🏞️ Nature Trekking & Rafting\n\nAll levels welcome. Limited to 30 participants for a truly intimate experience.`,
    category: 'health',
    tags: ['yoga', 'wellness', 'meditation', 'retreat', 'rishikesh'],
    banner: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    venue: { name: 'Ananda in the Himalayas', address: 'The Palace Estate, Narendra Nagar', city: 'Rishikesh', state: 'Uttarakhand', country: 'India', isOnline: false },
    startDate: new Date('2025-07-25T07:00:00'),
    endDate: new Date('2025-07-27T17:00:00'),
    ticketTiers: [
      { name: 'Shared Room', price: 8999, quantity: 20, sold: 12, maxPerUser: 1, description: '3-day retreat, shared accommodation + all meals' },
      { name: 'Private Room', price: 14999, quantity: 10, sold: 6, maxPerUser: 1, description: '3-day retreat, private room + premium meals + spa' },
    ],
    status: 'published',
    rating: { average: 5.0, count: 28 },
    refundPolicy: '7d',
  },
  {
    title: 'Standup Comedy Night — Kapil Sharma & Friends',
    shortDescription: 'An evening of unlimited laughs with Kapil Sharma, Zakir Khan, and Kanan Gill.',
    description: `Get ready for a night you'll never forget!\n\nIndia's biggest comedy night featuring:\n🎤 Kapil Sharma — The King of Comedy\n🎤 Zakir Khan — Sakht Launda himself\n🎤 Kanan Gill — Immature & Hilarious\n🎤 Sumukhi Suresh — Comedy Queen\n\nWith opening acts from the best upcoming comedians!\n\n⚠️ 18+ event. Strong language advisory.`,
    category: 'comedy',
    tags: ['comedy', 'standup', 'kapil', 'zakir', 'entertainment'],
    banner: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800&q=80',
    venue: { name: 'NSCI Dome', address: 'Worli Sports Club', city: 'Mumbai', state: 'Maharashtra', country: 'India', isOnline: false },
    startDate: new Date('2025-06-28T19:00:00'),
    endDate: new Date('2025-06-28T22:30:00'),
    ticketTiers: [
      { name: 'Silver', price: 1499, quantity: 1000, sold: 789, maxPerUser: 6, description: 'Unreserved seating, Silver Zone' },
      { name: 'Gold', price: 2999, quantity: 300, sold: 234, maxPerUser: 4, description: 'Reserved seating, Gold Zone' },
      { name: 'Platinum', price: 5999, quantity: 100, sold: 67, maxPerUser: 2, description: 'Front row, meet & greet post show' },
    ],
    status: 'published',
    featured: true,
    rating: { average: 4.9, count: 567 },
    refundPolicy: '24h',
  },
  {
    title: 'Python & AI Bootcamp — Zero to Machine Learning',
    shortDescription: '2-day intensive bootcamp: Learn Python, NumPy, Pandas, Scikit-learn, and build 5 AI projects.',
    description: `Transform your career with our intensive 2-day AI Bootcamp.\n\nWhat you'll learn:\n🐍 Python fundamentals for data science\n📊 Data analysis with NumPy & Pandas\n🤖 Machine Learning with Scikit-learn\n🧠 Introduction to Neural Networks\n🔨 Build 5 real-world AI projects\n\nPre-requisites: Basic programming knowledge. Bring your laptop.\n\nAll participants receive:\n✅ Course Certificate\n✅ 6 months mentorship access\n✅ GitHub portfolio setup`,
    category: 'education',
    tags: ['python', 'ai', 'machine learning', 'bootcamp', 'data science'],
    banner: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
    venue: { name: 'NASSCOM CoE', address: 'NASSCOM, Cyber City', city: 'Hyderabad', state: 'Telangana', country: 'India', isOnline: false },
    startDate: new Date('2025-07-12T09:00:00'),
    endDate: new Date('2025-07-13T17:00:00'),
    ticketTiers: [
      { name: 'Early Bird', price: 2499, quantity: 50, sold: 50, maxPerUser: 2, description: 'SOLD OUT - Early bird price' },
      { name: 'Standard', price: 3999, quantity: 100, sold: 67, maxPerUser: 2, description: '2-day bootcamp with all materials' },
    ],
    status: 'published',
    rating: { average: 4.7, count: 156 },
    refundPolicy: '48h',
  },
  {
    title: 'Coldplay India Tour — Mumbai Night 2',
    shortDescription: 'Coldplay returns to India for their Music of the Spheres World Tour — the most spectacular show on Earth.',
    description: `COLDPLAY IS BACK IN INDIA!\n\nAfter the historic sell-out tour, Coldplay returns to Mumbai for one more magical night.\n\n🌟 Full Music of the Spheres production\n🎆 Xylobands for every fan\n🎵 30+ songs across 3 hours\n🌈 Full LED & Drone light show\n\nThis is a once-in-a-lifetime experience. Don't miss it!\n\n⚠️ This is a rain or shine event.`,
    category: 'music',
    tags: ['coldplay', 'concert', 'rock', 'music', 'live'],
    banner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    venue: { name: 'DY Patil Stadium', address: 'Sector 7, Nerul', city: 'Mumbai', state: 'Maharashtra', country: 'India', isOnline: false },
    startDate: new Date('2025-08-15T18:00:00'),
    endDate: new Date('2025-08-15T22:00:00'),
    ticketTiers: [
      { name: 'GA Standing', price: 3999, quantity: 20000, sold: 19234, maxPerUser: 4, description: 'General admission standing area' },
      { name: 'Seated', price: 5999, quantity: 5000, sold: 4567, maxPerUser: 4, description: 'Reserved seating' },
      { name: 'Gold Circle', price: 9999, quantity: 1000, sold: 987, maxPerUser: 2, description: 'Premium standing, closest to stage' },
    ],
    status: 'published',
    featured: true,
    rating: { average: 5.0, count: 890 },
    refundPolicy: 'no-refund',
  },
];

const seed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected!');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Create users with pre-hashed passwords
    console.log('👥 Creating users...');
    const salt = await bcrypt.genSalt(12);
    const adminHash = await bcrypt.hash('Admin@1234', salt);
    const orgHash = await bcrypt.hash('Org@1234', salt);
    const userHash = await bcrypt.hash('User@1234', salt);

    const [adminUser, organizer1, organizer2, user1, user2] = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@eventsphere.ai',
        password: adminHash,
        role: 'admin',
        isVerified: true,
        isActive: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        phone: '+91 98765 43210',
        organizerProfile: { companyName: 'EventSphere AI', verified: true, totalRevenue: 5000000, totalEvents: 48 },
      },
      {
        name: 'Priya Sharma',
        email: 'organizer@eventsphere.ai',
        password: orgHash,
        role: 'organizer',
        isVerified: true,
        isActive: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        phone: '+91 87654 32109',
        organizerProfile: { companyName: 'TechEvents India', verified: true, totalRevenue: 2500000, totalEvents: 24 },
      },
      {
        name: 'Rahul Mehta',
        email: 'rahul.organizer@eventsphere.ai',
        password: orgHash,
        role: 'organizer',
        isVerified: true,
        isActive: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
        organizerProfile: { companyName: 'LiveEvents Co.', verified: true, totalRevenue: 1800000, totalEvents: 16 },
      },
      {
        name: 'Arjun Nair',
        email: 'user@eventsphere.ai',
        password: userHash,
        role: 'user',
        isVerified: true,
        isActive: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
        phone: '+91 76543 21098',
        preferences: { categories: ['tech', 'music', 'sports'], cities: ['Bangalore', 'Mumbai'] },
      },
      {
        name: 'Sneha Kapoor',
        email: 'sneha@eventsphere.ai',
        password: userHash,
        role: 'user',
        isVerified: true,
        isActive: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
        preferences: { categories: ['art', 'food', 'comedy'], cities: ['Delhi', 'Hyderabad'] },
      },
    ]);

    // Create events with organizers
    console.log('📅 Creating events...');
    const organizers = [organizer1, organizer1, organizer2, organizer1, organizer2, organizer1, organizer2, organizer1, organizer2, organizer1];
    const createdEvents = await Promise.all(events.map((ev, i) =>
      Event.create({
        ...ev,
        organizer: organizers[i]._id,
        views: Math.floor(Math.random() * 5000) + 500,
        analytics: {
          pageViews: Math.floor(Math.random() * 10000) + 1000,
          revenue: ev.ticketTiers.reduce((sum, t) => sum + (t.price * t.sold), 0),
          ticketsSold: ev.ticketTiers.reduce((sum, t) => sum + t.sold, 0),
        },
        totalSold: ev.ticketTiers.reduce((sum, t) => sum + t.sold, 0),
        totalCapacity: ev.ticketTiers.reduce((sum, t) => sum + t.quantity, 0),
        isFree: ev.ticketTiers.every(t => t.price === 0),
        minPrice: Math.min(...ev.ticketTiers.map(t => t.price)),
        maxPrice: Math.max(...ev.ticketTiers.map(t => t.price)),
      })
    ));

    // Create welcome notifications
    console.log('🔔 Creating notifications...');
    await Notification.insertMany([
      { recipient: adminUser._id, type: 'system', title: 'Welcome Admin!', message: 'EventSphere AI admin panel is ready. Check your analytics dashboard.', isRead: false },
      { recipient: organizer1._id, type: 'system', title: 'Welcome, Priya!', message: 'Your organizer account is verified. Start creating amazing events!', isRead: false },
      { recipient: organizer1._id, type: 'booking_confirmed', title: 'New Booking!', message: 'Someone just booked ReactConf India 2025 — 2 tickets.', isRead: false },
      { recipient: organizer2._id, type: 'system', title: 'Welcome, Rahul!', message: 'Your organizer account is ready. Create your first event today!', isRead: false },
      { recipient: user1._id, type: 'system', title: 'Welcome to EventSphere AI!', message: 'Discover amazing events near you with AI-powered recommendations.', isRead: false },
      { recipient: user1._id, type: 'event_reminder', title: '🎵 Coldplay is almost sold out!', message: 'Only 766 GA tickets remaining for Coldplay Mumbai Night 2!', isRead: false },
      { recipient: user2._id, type: 'system', title: 'Welcome, Sneha!', message: 'Explore art, food, and comedy events curated just for you!', isRead: false },
    ]);

    console.log('\n✅ ════════════════════════════════════════════');
    console.log('   EventSphere AI — Database Seeded!');
    console.log('════════════════════════════════════════════');
    console.log('\n📧 Demo Accounts:');
    console.log('   🔴 Admin   → admin@eventsphere.ai    | Admin@1234');
    console.log('   🟠 Org     → organizer@eventsphere.ai | Org@1234');
    console.log('   🟢 User    → user@eventsphere.ai     | User@1234');
    console.log('\n📅 Events Created: ' + createdEvents.length);
    console.log('   Categories: Tech, Music, Sports, Art, Food, Business, Health, Comedy, Education');
    console.log('\n🚀 Start backend: npm run dev');
    console.log('════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seed();
