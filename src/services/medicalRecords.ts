import api from './api';
import type { MedicalRecord, ApiResponse } from '../types';

export const medicalRecordService = {
  // Staff: Upload medical record
  uploadRecord: async (appointmentId: number, formData: FormData): Promise<ApiResponse<MedicalRecord>> => {
    const response = await api.post<ApiResponse<MedicalRecord>>(
      `/appointments/${appointmentId}/records`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get records for an appointment
  getRecords: async (appointmentId: number): Promise<ApiResponse<MedicalRecord[]>> => {
    const response = await api.get<ApiResponse<MedicalRecord[]>>(`/appointments/${appointmentId}/records`);
    return response.data;
  },

  // Download record
  downloadRecord: async (recordId: number): Promise<Blob> => {
    const response = await api.get(`/medical-records/${recordId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Staff: Get all medical records for a specific user
  getUserRecords: async (userId: number): Promise<ApiResponse<MedicalRecord[]>> => {
    const response = await api.get<ApiResponse<MedicalRecord[]>>(`/staff/patients/${userId}/records`);
    return response.data;
  },

  // Staff: Delete record
  deleteRecord: async (recordId: number): Promise<void> => {
    await api.delete(`/records/${recordId}`);
  },
};
