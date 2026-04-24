import { create } from 'zustand';
import { logout as apiLogout } from '../api/auth.api.js';
import axiosClient from '../api/axiosClient.js';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      // Even if the API call fails, clear local state
      console.error('Logout request failed:', error);
    } finally {
      set({ user: null, accessToken: null });
    }
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch {
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));

/**
 * BUG FIX: Was checking role === 'admin' (lowercase)
 * Backend Prisma enum returns 'ADMIN' (uppercase).
 * This caused isAdmin to always be false, hiding Dashboard/Members/AuditLog for everyone.
 */
export const selectIsAdmin = (state) =>
  state.user?.role === 'ADMIN' || state.user?.role === 'admin';