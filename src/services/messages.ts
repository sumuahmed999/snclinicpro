import api from './api';
import type { Message, ApiResponse, PaginatedResponse } from '../types';

export interface SendMessageData {
  recipient_id?: number;
  subject: string;
  content: string;
  attachment?: File;
}

export const messageService = {
  // Send message
  sendMessage: async (data: SendMessageData): Promise<ApiResponse<Message>> => {
    const formData = new FormData();
    
    // Only append recipient_id if it exists and is not 0
    if (data.recipient_id && data.recipient_id > 0) {
      formData.append('recipient_id', data.recipient_id.toString());
    }
    
    formData.append('subject', data.subject);
    formData.append('content', data.content);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    const response = await api.post<ApiResponse<Message>>('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get messages (threads)
  getMessages: async (params?: {
    page?: number;
  }): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>('/messages', { params });
    return response.data;
  },

  // Get message details
  getMessage: async (id: number): Promise<ApiResponse<Message>> => {
    const response = await api.get<ApiResponse<Message>>(`/messages/${id}`);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (id: number): Promise<ApiResponse<Message>> => {
    const response = await api.put<ApiResponse<Message>>(`/messages/${id}/read`);
    return response.data;
  },
};
