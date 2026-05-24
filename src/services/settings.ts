import api from './api';
import type { Setting, ApiResponse } from '../types';

export interface UpdateSettingsData {
  [key: string]: string | number | boolean;
}

export const settingsService = {
  // Get public settings
  getPublicSettings: async (): Promise<ApiResponse<Setting[]>> => {
    const response = await api.get<ApiResponse<Setting[]>>('/settings');
    return response.data;
  },

  // Admin: Get all settings
  getAllSettings: async (): Promise<ApiResponse<Setting[]>> => {
    const response = await api.get<ApiResponse<Setting[]>>('/admin/settings');
    return response.data;
  },

  // Admin: Update settings
  updateSettings: async (data: UpdateSettingsData): Promise<ApiResponse<Setting[]>> => {
    const response = await api.put<ApiResponse<Setting[]>>('/admin/settings', data);
    return response.data;
  },
};
