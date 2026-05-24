import { useQuery } from '@tanstack/react-query';
import { slotService } from '../services/slots';

export const useSlots = (params?: {
  doctor_id?: number;
  date?: string;
  is_active?: boolean;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['slots', params],
    queryFn: () => slotService.getSlots(params),
  });
};

export const useAvailableSlots = (params?: { doctor_id?: number; date?: string }) => {
  return useQuery({
    queryKey: ['available-slots', params],
    queryFn: () => slotService.getAvailableSlots(params),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useDoctorSlots = (
  doctorId: number,
  params?: { date?: string; start_date?: string; end_date?: string }
) => {
  return useQuery({
    queryKey: ['doctor-slots', doctorId, params],
    queryFn: () => slotService.getDoctorSlots(doctorId, params),
    enabled: !!doctorId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
