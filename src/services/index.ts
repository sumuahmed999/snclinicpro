// Export all services
export { default as api } from './api';
export { authService } from './auth';
export { appointmentService } from './appointments';
export { doctorService } from './doctors';
export { slotService } from './slots';
export { paymentService } from './payments';
export { familyMemberService } from './familyMembers';
export { medicalRecordService } from './medicalRecords';
export { messageService } from './messages';
export { feedbackService } from './feedback';
export { settingsService } from './settings';
export { patientService } from './patients';
export { analyticsService } from './analytics';

// Export types
export type * from './auth';
export type * from './appointments';
export type * from './doctors';
export type * from './slots';
export type * from './payments';
export type * from './familyMembers';
export type * from './messages';
export type * from './feedback';
export type * from './settings';
export type * from './analytics';
