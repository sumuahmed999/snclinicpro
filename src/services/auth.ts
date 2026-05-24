import api from './api';
import type { User, ApiResponse } from '../types';

export interface LoginCredentials {
  login: string; // Can be email or mobile
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const authService = {
  // Register new patient
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', data);
    return response.data;
  },

  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/logout');
  },

  // Get authenticated user
  getUser: async (): Promise<User> => {
    const response = await api.get<User>('/user');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/user/profile', data);
    return response.data.data;
  },
};
