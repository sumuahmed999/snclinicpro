// Common types for the application

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address?: string;
  profile_picture?: string;
  role: 'patient' | 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  qualification: string;
  consultation_fee: number;
  working_days: string[];
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: number;
  doctor_id: number;
  doctor?: Doctor;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  is_active: boolean;
  available_capacity: number;
  is_full: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  slot_id: number;
  doctor_id: number;
  family_member_id?: number;
  token_number: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  booked_by?: number;
  booking_type: 'self' | 'staff' | 'admin';
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  slot?: Slot;
  doctor?: Doctor;
  family_member?: FamilyMember;
  payment?: Payment;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  mobile?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  appointment_id: number;
  amount: number;
  payment_method: 'online' | 'cash' | 'manual';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transaction_id?: string;
  gateway_response?: Record<string, unknown>;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  record_type: 'prescription' | 'lab_report' | 'radiology_report' | 'other';
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  content: string;
  attachment_path?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: User;
  recipient?: User;
}

export interface Feedback {
  id: number;
  appointment_id: number;
  user_id: number;
  doctor_id: number;
  rating: number;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'integer' | 'boolean' | 'json';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  status_counts?: {
    active: number;
    inactive: number;
    total: number;
  };
}
