import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),

      register: async (username, email, password) => {
        const { data } = await api.post('/auth/register', { username, email, password });
        set({ user: data.user, token: data.token });
        return data;
      },

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, token: data.token });
        return data;
      },
    }),
    {
      name: 'auth-storage',
      partialState: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
