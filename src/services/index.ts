import axios from 'axios';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();

  if (authStore.access_token) {
    config.headers.Authorization = `Bearer ${authStore.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.$reset();
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
