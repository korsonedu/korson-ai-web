import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// 请求拦截器：自动注入 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'mock-token') {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
