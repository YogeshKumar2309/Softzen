import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (uniqueId, password) => {
        const res = await api.post('/user/login', { uniqueId, password });
        if (res.data.success) {
          localStorage.setItem('token', res.data.data.token);
          set({
            user: {
              uniqueId: res.data.data.uniqueId,
              level: res.data.data.level,
            },
            token: res.data.data.token,
          });
          return { ok: true };
        }
        return { ok: false, message: res.data.message };
      },

      register: async (uniqueId, password, message) => {
        const res = await api.post('/user/register', {
          uniqueId,
          password,
          message,
        });
        return res.data;
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'softzen-auth',
    }
  )
);