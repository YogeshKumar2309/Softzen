import { create } from 'zustand';
import { api } from '../lib/api';

export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  page: 1,
  limit: 12,
  totalMembers: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
  onlineCount: 0,

  search: '',
  level: null,
  status: null,
  sort: 'createdAt',
  order: 'desc',

  setSearch: (search) => set({ search, page: 1 }),
  setLevel: (level) => set({ level, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setSort: (sort, order) => set({ sort, order, page: 1 }),
  setPage: (page) => set({ page }),
  setOnlineCount: (n) => set({ onlineCount: n }),

  fetchUsers: async () => {
    const { page, limit, search, level, status, sort, order } = get();
    set({ loading: true, error: null });

    try {
      const params = { page, limit, sort, order };
      if (search) params.search = search;
      if (level) params.level = level;
      if (status) params.status = status;

      const res = await api.get('/user/all', { params });
      const d = res.data;

      set({
        users: d.data,
        totalMembers: d.pagination.totalMembers,
        totalPages: d.pagination.totalPages,
        hasNextPage: d.pagination.hasNextPage,
        hasPrevPage: d.pagination.hasPrevPage,
        onlineCount: d.onlineCount || 0,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      set({
        error: err.response?.data?.message || 'Users load nahi ho paye.',
        loading: false,
      });
    }
  },

  reset: () =>
    set({
      search: '',
      level: null,
      status: null,
      page: 1,
      sort: 'createdAt',
      order: 'desc',
    }),
}));