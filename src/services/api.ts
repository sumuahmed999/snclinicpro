import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';
import type { ApiError } from '../types';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds - balanced timeout
  withCredentials: false, // We're using Bearer tokens, not cookies
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      const isUserEndpoint = error.config?.url?.includes('/user');
      
      if (!isUserEndpoint) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = '/login';
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
