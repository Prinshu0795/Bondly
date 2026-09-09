import axios from 'axios';

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  return url ? `${url.replace(/\/$/, '')}/api` : 'http://localhost:5000/api';
};
const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bondly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bondly_token');
      localStorage.removeItem('bondly_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
