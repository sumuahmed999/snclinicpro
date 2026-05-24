import api from './api';
import type { Doctor, Slot, ApiResponse, PaginatedResponse } from '../types';

export interface CreateDoctorData {
  name: string;
  specialization: string;
  qualification: string;
  consultation_fee: number;
  working_days: string[];
  profile_photo?: string;
}

export interface UpdateDoctorData extends Partial<CreateDoctorData> {
  is_active?: boolean;
}

export const doctorService = {
  // Get all doctors (public)
  getDoctors: async (params?: {
    specialization?: string;
    is_active?: boolean;
    page?: number;
    all?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Doctor>> => {
    const response = await api.get<PaginatedResponse<Doctor>>('/doctors', { params });
    return response.data;
  },

  // Get doctor details
  getDoctor: async (id: number): Promise<ApiResponse<Doctor>> => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data;
  },

  // Get doctor availability (slots)
  getDoctorAvailability: async (id: number, params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Slot[]>> => {
    const response = await api.get<ApiResponse<Slot[]>>(`/doctors/${id}/availability`, { params });
    return response.data;
  },

  // Admin: Create doctor
  createDoctor: async (data: CreateDoctorData): Promise<ApiResponse<Doctor>> => {
    const response = await api.post<ApiResponse<Doctor>>('/admin/doctors', data);
    return response.data;
  },

  // Admin: Update doctor
  updateDoctor: async (id: number, data: UpdateDoctorData): Promise<ApiResponse<Doctor>> => {
    const response = await api.put<ApiResponse<Doctor>>(`/admin/doctors/${id}`, data);
    return response.data;
  },

  // Admin: Delete doctor
  deleteDoctor: async (id: number): Promise<void> => {
    await api.delete(`/admin/doctors/${id}`);
  },

  // Admin: Create doctor with photo
  createDoctorWithPhoto: async (formData: FormData): Promise<ApiResponse<Doctor>> => {
    const response = await api.post<ApiResponse<Doctor>>('/admin/doctors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin: Update doctor with photo
  updateDoctorWithPhoto: async (id: number, formData: FormData): Promise<ApiResponse<Doctor>> => {
    const response = await api.post<ApiResponse<Doctor>>(`/admin/doctors/${id}?_method=PUT`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
