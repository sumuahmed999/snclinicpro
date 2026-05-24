// API Base URL - should be configured via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Token storage key
export const AUTH_TOKEN_KEY = 'auth_token';

// User roles
export const USER_ROLES = {
  PATIENT: 'patient',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

// Appointment statuses
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  ONLINE: 'online',
  CASH: 'cash',
  MANUAL: 'manual',
} as const;

// Medical record types
export const RECORD_TYPES = {
  PRESCRIPTION: 'prescription',
  LAB_REPORT: 'lab_report',
  RADIOLOGY_REPORT: 'radiology_report',
  OTHER: 'other',
} as const;

// Gender options
export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

// Days of the week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;
