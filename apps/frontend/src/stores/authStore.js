import { create } from 'zustand';
import { logout as apiLogout } from '../api/auth.api.js';
import axiosClient from '../api/axiosClient.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always forcefully clear the auth state locally
      set({ user: null, accessToken: null });
    }
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      // Rely on the axios interceptor to attach the current token automatically
      const response = await axiosClient.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ user: null, accessToken: null, isLoading: false });
    }
  }
}));

export const selectIsAdmin = (state) => state.user?.role === 'admin';
