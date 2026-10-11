import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage =
      error.response?.data?.error ||
      error.response?.data?.message;

    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }
    return Promise.reject(error);
  }
);

export default api;

