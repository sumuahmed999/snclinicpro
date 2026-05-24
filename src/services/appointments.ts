import api from './api';
import type { Appointment, ApiResponse, PaginatedResponse } from '../types';

export interface BookAppointmentData {
  slot_id: number;
  family_member_id?: number;
  notes?: string;
}

export interface ManualBookingData {
  user_id: number;
  slot_id: number;
  family_member_id?: number;
  payment_status: 'pending' | 'paid';
  payment_method?: 'cash' | 'online' | 'manual';
  is_emergency?: boolean;
  notes?: string;
}

export interface RescheduleData {
  new_slot_id: number;
}

export interface CancelData {
  reason?: string;
}

export interface UpdateStatusData {
  action: 'approve' | 'reject' | 'complete';
  reason?: string;
}

export const appointmentService = {
  // Patient booking
  bookAppointment: async (data: BookAppointmentData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data;
  },

  // Get user's appointments
  getAppointments: async (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<PaginatedResponse<Appointment>>('/appointments', { params });
    return response.data;
  },

  // Get appointment details
  getAppointment: async (id: number): Promise<ApiResponse<Appointment>> => {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (id: number, data?: CancelData): Promise<ApiResponse<Appointment>> => {
    const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, data);
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (id: number, data: RescheduleData): Promise<ApiResponse<Appointment>> => {
    const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Staff/Admin: Manual booking
  manualBooking: async (data: ManualBookingData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post<ApiResponse<Appointment>>('/staff/appointments', data);
    return response.data;
  },

  // Staff/Admin: Get all appointments
  getAllAppointments: async (params?: {
    doctor_id?: number;
    slot_id?: number;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<PaginatedResponse<Appointment>>('/staff/appointments/all', { params });
    return response.data;
  },

  // Staff/Admin: Update appointment status
  updateStatus: async (id: number, data: UpdateStatusData): Promise<ApiResponse<Appointment>> => {
    const response = await api.put<ApiResponse<Appointment>>(`/staff/appointments/${id}/status`, data);
    return response.data;
  },
};
