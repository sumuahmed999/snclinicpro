import api from './api';
import type { Slot, ApiResponse, PaginatedResponse } from '../types';

export interface CreateSlotData {
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
}

export interface UpdateSlotData {
  doctor_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  is_active?: boolean;
}

export const slotService = {
  // Get slots with filters
  getSlots: async (params?: {
    doctor_id?: number;
    date?: string;
    is_active?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<Slot>> => {
    const response = await api.get<PaginatedResponse<Slot>>('/slots', { params });
    return response.data;
  },

  // Get available slots
  getAvailableSlots: async (params?: {
    doctor_id?: number;
    date?: string;
  }): Promise<ApiResponse<Slot[]>> => {
    const response = await api.get<ApiResponse<Slot[]>>('/slots/available', { params });
    return response.data;
  },

  // Get slots for a specific doctor
  getDoctorSlots: async (doctorId: number, params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Slot[]>> => {
    const response = await api.get<ApiResponse<Slot[]>>(`/doctors/${doctorId}/slots`, { params });
    return response.data;
  },

  // Admin: Create slot
  createSlot: async (data: CreateSlotData): Promise<ApiResponse<Slot>> => {
    const response = await api.post<ApiResponse<Slot>>('/admin/slots', data);
    return response.data;
  },

  // Admin: Bulk create slots
  bulkCreateSlots: async (data: {
    doctor_id: number;
    start_date: string;
    end_date: string;
    time_slots: Array<{ start_time: string; end_time: string }>;
    max_capacity: number;
  }): Promise<ApiResponse<Slot[]>> => {
    const response = await api.post<ApiResponse<Slot[]>>('/admin/slots/bulk', data);
    return response.data;
  },

  // Admin: Update slot
  updateSlot: async (id: number, data: UpdateSlotData): Promise<ApiResponse<Slot>> => {
    const response = await api.put<ApiResponse<Slot>>(`/admin/slots/${id}`, data);
    return response.data;
  },

  // Admin: Delete slot
  deleteSlot: async (id: number): Promise<void> => {
    await api.delete(`/admin/slots/${id}`);
  },
};
