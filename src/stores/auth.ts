import { defineStore } from 'pinia';
import api from '@/services/index';
import type { User, Account, AuthResponse, AuthRegister } from '@/types';

interface AuthState {
  access_token: string | null;
  user: User | null;
  account: Account | null;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    access_token: null,
    user: null,
    account: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.access_token,
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      try {
        const { data } = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
        });

        this.access_token = data.access_token;
        this.user = data.user;
      } finally {
        this.loading = false;
      }
    },

    async register(data: AuthRegister) {
      this.loading = true;
      try {
        await api.post<AuthRegister>('/auth/register', data);

        return true;
      } finally {
        this.loading = false;
      }
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me');
      this.user = data.user;
      this.account = data.account;
    },

    async logout() {
      try {
        await api.post('/auth/logout');
      } finally {
        this.$reset();
      }
    },
  },

  persist: {
    key: 'auth',
    storage: localStorage,
    pick: ['access_token', 'user', 'account'],
  },
});
