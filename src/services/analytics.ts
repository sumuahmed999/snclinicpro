import api from './api';
import type { ApiResponse } from '../types';

export interface DashboardStats {
  total_appointments: number;
  total_revenue: number;
  total_patients: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

export interface AppointmentTrend {
  date: string;
  count: number;
}

export interface RecentActivity {
  id: number;
  type: 'appointment' | 'payment' | 'registration';
  description: string;
  timestamp: string;
}

export const analyticsService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/analytics/stats');
    return response.data;
  },

  // Get appointment trends
  getAppointmentTrends: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<AppointmentTrend[]>> => {
    const response = await api.get<ApiResponse<AppointmentTrend[]>>('/admin/analytics/trends', { params });
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    const response = await api.get<ApiResponse<RecentActivity[]>>('/admin/analytics/activity', {
      params: { limit }
    });
    return response.data;
  },
};
