import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission for this action');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject({ message, status: error.response?.status });
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  logout: () => api.post('/auth/logout'),
};

// Events
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getFeatured: () => api.get('/events/featured'),
  getCategories: () => api.get('/events/categories'),
  getMyEvents: () => api.get('/events/my-events'),
  publish: (id) => api.patch(`/events/${id}/publish`),
};

// Payments
export const paymentAPI = {
  getKey: () => api.get('/payments/key'),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  requestRefund: (bookingId, data) => api.post(`/payments/refund/${bookingId}`, data),
  validateCoupon: (data) => api.post('/payments/validate-coupon', data),
};

// AI
export const aiAPI = {
  getRecommendations: () => api.get('/ai/recommendations'),
  getTrending: () => api.get('/ai/trending'),
  trackBehavior: (data) => api.post('/ai/track', data),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getEvents: (params) => api.get('/admin/events', { params }),
  toggleFeature: (id) => api.patch(`/admin/events/${id}/feature`),
  getFraud: () => api.get('/admin/fraud'),
  broadcastNotification: (data) => api.post('/admin/notify', data),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
};

// Organizer
export const organizerAPI = {
  getStats: () => api.get('/organizer/stats'),
  getAttendees: (eventId, params) => api.get(`/organizer/events/${eventId}/attendees`, { params }),
  checkIn: (data) => api.post('/organizer/checkin', data),
  getCheckinStats: (eventId) => api.get(`/organizer/events/${eventId}/checkin-stats`),
};

// User
export const userAPI = {
  getBookings: () => api.get('/users/bookings'),
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id) => api.patch(`/users/notifications/${id}/read`),
  markAllRead: () => api.patch('/users/notifications/read-all'),
  getWishlist: () => api.get('/users/wishlist'),
  toggleWishlist: (eventId) => api.post(`/users/wishlist/${eventId}`),
};

export default api;
