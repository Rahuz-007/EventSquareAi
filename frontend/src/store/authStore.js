import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      
      updateUser: (userData) => set(state => ({ user: { ...state.user, ...userData } })),
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      isAdmin: () => get().user?.role === 'admin',
      isOrganizer: () => ['organizer', 'admin'].includes(get().user?.role),
    }),
    { name: 'eventsphere-auth', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
);

export default useAuthStore;
