import api from './api';
import type { FamilyMember, ApiResponse } from '../types';

export interface CreateFamilyMemberData {
  name: string;
  relationship: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  mobile?: string;
  profile_picture?: File;
}

export interface UpdateFamilyMemberData extends Partial<CreateFamilyMemberData> {}

export const familyMemberService = {
  // Get all family members
  getFamilyMembers: async (): Promise<ApiResponse<FamilyMember[]>> => {
    const response = await api.get<ApiResponse<FamilyMember[]>>('/family-members');
    return response.data;
  },

  // Add family member
  addFamilyMember: async (data: CreateFamilyMemberData): Promise<ApiResponse<FamilyMember>> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('relationship', data.relationship);
    formData.append('date_of_birth', data.date_of_birth);
    formData.append('gender', data.gender);
    if (data.mobile) {
      formData.append('mobile', data.mobile);
    }
    if (data.profile_picture) {
      formData.append('profile_picture', data.profile_picture);
    }

    const response = await api.post<ApiResponse<FamilyMember>>('/family-members', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update family member
  updateFamilyMember: async (id: number, data: UpdateFamilyMemberData): Promise<ApiResponse<FamilyMember>> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.relationship) formData.append('relationship', data.relationship);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.mobile !== undefined) formData.append('mobile', data.mobile);
    if (data.profile_picture) {
      formData.append('profile_picture', data.profile_picture);
    }

    // Laravel doesn't support PUT with FormData, so we use POST with _method
    formData.append('_method', 'PUT');

    const response = await api.post<ApiResponse<FamilyMember>>(`/family-members/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete family member
  deleteFamilyMember: async (id: number): Promise<void> => {
    await api.delete(`/family-members/${id}`);
  },
};
