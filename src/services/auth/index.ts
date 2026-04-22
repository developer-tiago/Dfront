import axios from '@/services/index';
import type { AuthCredentials, ProfileUpdateData } from '@/types/auth';

export default {
  login(data: AuthCredentials) {
    return axios.post('/auth/login', data);
  },

  logout() {
    return axios.post('/auth/logout');
  },

  getProfile() {
    return axios.get('/auth/me');
  },

  updateProfile(data: ProfileUpdateData) {
    return axios.put('/auth/profile', data);
  },
};
