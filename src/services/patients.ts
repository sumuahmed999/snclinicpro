import api from './api';
import type { User, ApiResponse, PaginatedResponse } from '../types';

export const patientService = {
  // Staff/Admin: Get all patients
  getPatients: async (params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/staff/patients', { params });
    return response.data;
  },

  // Staff/Admin: Search patients
  searchPatients: async (query: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/staff/patients', {
      params: { search: query },
    });
    return response.data;
  },

  // Staff/Admin: Create new patient
  createPatient: async (data: {
    name: string;
    mobile: string;
    email?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/staff/patients', data);
    return response.data;
  },

  // Staff/Admin: Get patient profile with history
  getPatient: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`/staff/patients/${id}`);
    return response.data;
  },

  // Staff/Admin: Get patient profile with complete history
  getPatientProfile: async (id: number): Promise<any> => {
    const response = await api.get(`/staff/patients/${id}`);
    return response.data;
  },

  // Admin: Deactivate patient account
  deactivatePatient: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/staff/patients/${id}/deactivate`);
    return response.data;
  },
};
