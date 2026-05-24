import api from './api';
import type { Payment, ApiResponse } from '../types';

export interface InitiatePaymentResponse {
  order_id: string;
  amount: number;
  key: string;
}

export interface VerifyPaymentData {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  [key: string]: string | undefined;
}

export interface ManualPaymentData {
  payment_method: 'cash' | 'manual';
  amount?: number;
}

export const paymentService = {
  // Initiate online payment
  initiatePayment: async (appointmentId: number): Promise<ApiResponse<InitiatePaymentResponse>> => {
    const response = await api.post<ApiResponse<InitiatePaymentResponse>>(
      `/payments/${appointmentId}/initiate`
    );
    return response.data;
  },

  // Verify payment (callback from gateway)
  verifyPayment: async (appointmentId: number, data: VerifyPaymentData): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(
      `/payments/${appointmentId}/verify`,
      data
    );
    return response.data;
  },

  // Staff: Record manual payment
  recordManualPayment: async (appointmentId: number, data: ManualPaymentData): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(
      `/payments/${appointmentId}/manual`,
      data
    );
    return response.data;
  },

  // Get payment details
  getPayment: async (appointmentId: number): Promise<ApiResponse<Payment>> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${appointmentId}`);
    return response.data;
  },

  // Download invoice
  downloadInvoice: async (appointmentId: number): Promise<Blob> => {
    const response = await api.get(`/payments/${appointmentId}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (params?: {
    page?: number;
  }): Promise<ApiResponse<Payment[]>> => {
    const response = await api.get<ApiResponse<Payment[]>>('/payments/history', { params });
    return response.data;
  },
};
