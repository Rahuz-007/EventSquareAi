# 🌐 EventSphere AI — Full-Stack SaaS Event Platform

> A production-level, AI-powered event management SaaS platform with smart recommendations, Razorpay payment integration, QR ticket generation, real-time analytics, and fraud detection.

![EventSphere AI](https://img.shields.io/badge/EventSphere%20AI-v1.0.0-6366f1?style=for-the-badge&logo=sparkles)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?style=for-the-badge&logo=mongodb)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)

---

## 🏗️ Architecture Overview

```
EventSphere AI/
├── backend/           # Node.js + Express.js REST API
├── frontend/          # React.js + Tailwind CSS + Framer Motion
├── ai-service/        # Python Flask AI Microservice
└── README.md
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT + Role-Based Access Control |
| **Payments** | Razorpay (Indian Payment Gateway) |
| **AI Service** | Python Flask, scikit-learn |
| **Real-time** | Socket.io |
| **Email** | Nodemailer (SMTP) |
| **QR Codes** | qrcode.js + qrcode.react |
| **State** | Zustand (Frontend) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Python 3.10+
- npm / pip

---

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/eventsphere-ai.git
cd eventsphere-ai
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

**Backend runs on:** `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api

npm start
```

**Frontend runs on:** `http://localhost:3000`

---

### 4. AI Microservice Setup

```bash
cd ai-service
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
python app.py
```

**AI Service runs on:** `http://localhost:8000`

---

## 🔐 Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventsphere
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@eventsphere.ai
FROM_NAME=EventSphere AI

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
CLIENT_URL=http://localhost:3000
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxxx
```

---

## 👥 Role System

| Role | Permissions |
|------|------------|
| **user** | Browse events, book tickets, view bookings, get AI recommendations |
| **organizer** | All user permissions + Create/manage events, view attendees, QR check-in, organizer analytics |
| **admin** | All permissions + User management, platform analytics, fraud monitoring, broadcast notifications |

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (search, filter, paginate) |
| GET | `/api/events/:id` | Event detail |
| POST | `/api/events` | Create event (organizer) |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/events/featured` | Featured events |
| GET | `/api/events/my-events` | Organizer's events |
| PATCH | `/api/events/:id/publish` | Publish event |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment + confirm booking |
| GET | `/api/payments/history` | Payment history |
| POST | `/api/payments/refund/:id` | Request refund |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/recommendations` | Personalized recommendations |
| GET | `/api/ai/trending` | Trending events |
| POST | `/api/ai/track` | Track user behavior |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform KPIs |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/toggle-status` | Ban/unban user |
| GET | `/api/admin/fraud` | Flagged bookings |
| GET | `/api/admin/analytics/revenue` | Revenue analytics |
| POST | `/api/admin/notify` | Broadcast notification |

---

## 🤖 AI Features

### 1. Event Recommendation Engine
- **Algorithm:** Cosine similarity + category/tag boosting
- **Fallback:** Trending events (view-count based)
- **Enhancement:** Flask AI service re-ranks results using ML scores

### 2. Fraud Detection
- **7 detection signals:** Rapid bookings, repeated same event, high quantity, large amounts, new account, no history, failed payments
- **Score range:** 0–100 (>80 = block, >50 = flag for review)
- **Real-time:** Runs on every payment creation

### 3. User Behavior Tracking
- Tracks event views and search history
- Used to personalize recommendations

---

## 💳 Razorpay Integration Flow

```
1. User selects ticket tier → clicks "Book Now"
2. Frontend → POST /api/payments/create-order
   - Fraud check runs
   - Razorpay order created
   - Pending booking saved
3. Razorpay checkout modal opens
4. User pays → Razorpay sends response
5. Frontend → POST /api/payments/verify
   - HMAC SHA256 signature verification
   - QR codes generated for all tickets
   - Booking confirmed
   - Confirmation email sent
   - Socket.io real-time notification
```

---

## 📊 Database Schema Summary

### User
- `name`, `email`, `password` (bcrypt), `role` (user/organizer/admin)
- `behavior`: viewedEvents, searchHistory, lastActivity
- `organizerProfile`: companyName, totalRevenue, verified

### Event
- `title`, `slug`, `description`, `category`, `tags`
- `ticketTiers[]`: name, price, quantity, sold, maxPerUser
- `venue`: name, address, city, coordinates, isOnline
- `analytics`: pageViews, revenue, conversionRate
- `aiEmbedding[]` for future semantic search

### Booking
- `bookingId` (EVS-XXXXXXX), `user`, `event`
- `payment`: razorpayOrderId, paymentId, signature, status
- `tickets[]`: ticketNumber, qrCode, isCheckedIn, checkedInAt
- `fraudScore`, `fraudFlags`, `isFlagged`

---

## 🚀 Deployment

### Backend (Railway / Render / EC2)
```bash
# Set environment variables in platform dashboard
# Start command:
node src/server.js
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the /build folder
# Set REACT_APP_* env vars in dashboard
```

### AI Service (Railway / Heroku)
```bash
# Start command:
gunicorn app:app --bind 0.0.0.0:$PORT
```

### MongoDB
- Use **MongoDB Atlas** for production
- Connection string: `mongodb+srv://user:pass@cluster.mongodb.net/eventsphere`

---

## 🔒 Security Features

- ✅ JWT authentication with expiry
- ✅ bcrypt password hashing (salt rounds: 12)
- ✅ Razorpay HMAC SHA256 signature verification
- ✅ Express rate limiting (100 req/15min)
- ✅ Helmet.js security headers
- ✅ MongoDB injection sanitization
- ✅ XSS protection middleware
- ✅ CORS whitelisting
- ✅ Input validation (express-validator)
- ✅ AI-powered fraud detection

---

## 📁 Full Folder Structure

```
EventSphere/
├── backend/
│   ├── src/
│   │   ├── config/         # database.js, logger.js
│   │   ├── controllers/    # auth, event, payment, admin, organizer, ai
│   │   ├── middleware/     # auth, asyncHandler, errorHandler, validate
│   │   ├── models/         # User, Event, Booking, Notification, Review
│   │   ├── routes/         # all route files
│   │   ├── services/       # email, qr, fraud, socket, upload
│   │   ├── utils/          # ErrorResponse
│   │   └── server.js       # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # common/, dashboard/, landing/
│   │   ├── pages/          # LandingPage, EventsPage, EventDetailPage
│   │   │   ├── auth/       # LoginPage, RegisterPage
│   │   │   └── dashboard/  # Layout, Admin, Organizer, User, Bookings, etc.
│   │   ├── services/       # api.js (axios)
│   │   ├── store/          # authStore.js (Zustand)
│   │   ├── hooks/          # custom hooks
│   │   ├── utils/          # helpers
│   │   ├── App.js          # Router + lazy loading
│   │   └── index.css       # Tailwind + glassmorphism
│   ├── tailwind.config.js
│   └── package.json
│
├── ai-service/
│   ├── app.py              # Flask app with recommendation + fraud endpoints
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## 🎯 Feature Checklist

- [x] JWT Authentication + Role-Based Access (user/organizer/admin)
- [x] Event CRUD with ticket tiers and capacity management
- [x] Razorpay payment integration with signature verification
- [x] QR code ticket generation per booking
- [x] Email confirmation with HTML templates
- [x] AI recommendation engine (cosine similarity)
- [x] Fraud detection (7-signal scoring system)
- [x] Admin analytics dashboard with Recharts
- [x] Organizer dashboard with event performance metrics
- [x] QR check-in system with real-time Socket.io updates
- [x] Full-text event search with MongoDB text indexes
- [x] Category and price filtering with pagination
- [x] Real-time notifications via Socket.io
- [x] Animated landing page with Framer Motion
- [x] Glassmorphism dark SaaS UI design
- [x] Refund management via Razorpay API
- [x] User behavior tracking for personalization
- [x] Mobile-first responsive design
- [x] Rate limiting and security middleware
- [x] Centralized error handling
- [x] Production-ready deployment configuration

---

## 📞 Support

For issues or feature requests, open a GitHub issue.

**Built with ❤️ for EventSphere AI — 2025**
