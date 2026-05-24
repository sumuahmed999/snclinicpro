import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, type BookAppointmentData, type RescheduleData, type CancelData } from '../services/appointments';

export const useAppointments = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentService.getAppointments(params),
  });
};

export const useAppointment = (id: number) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getAppointment(id),
    enabled: !!id,
  });
};

export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookAppointmentData) => appointmentService.bookAppointment(data),
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Invalidate all slot-related queries (including doctor-slots)
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: CancelData }) =>
      appointmentService.cancelAppointment(id, data),
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Invalidate all slot-related queries (including doctor-slots)
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
    },
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RescheduleData }) =>
      appointmentService.rescheduleAppointment(id, data),
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Invalidate all slot-related queries (including doctor-slots)
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
    },
  });
};
