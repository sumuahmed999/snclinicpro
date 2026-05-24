import api from './api';
import type { Feedback, ApiResponse, PaginatedResponse } from '../types';

export interface SubmitFeedbackData {
  rating: number;
  comments?: string;
}

export const feedbackService = {
  // Submit feedback for appointment
  submitFeedback: async (appointmentId: number, data: SubmitFeedbackData): Promise<ApiResponse<Feedback>> => {
    const response = await api.post<ApiResponse<Feedback>>(
      `/appointments/${appointmentId}/feedback`,
      data
    );
    return response.data;
  },

  // Get user's feedback
  getUserFeedback: async (params?: {
    page?: number;
  }): Promise<PaginatedResponse<Feedback>> => {
    const response = await api.get<PaginatedResponse<Feedback>>('/feedback', { params });
    return response.data;
  },

  // Get doctor ratings (public)
  getDoctorFeedback: async (doctorId: number, params?: {
    page?: number;
  }): Promise<PaginatedResponse<Feedback>> => {
    const response = await api.get<PaginatedResponse<Feedback>>(`/doctors/${doctorId}/feedback`, { params });
    return response.data;
  },

  // Admin: Get all feedback
  getAllFeedback: async (params?: {
    doctor_id?: number;
    rating?: number;
    page?: number;
  }): Promise<PaginatedResponse<Feedback>> => {
    const response = await api.get<PaginatedResponse<Feedback>>('/admin/feedback', { params });
    return response.data;
  },
};
