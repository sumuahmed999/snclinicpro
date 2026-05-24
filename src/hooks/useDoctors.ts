import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../services/doctors';

export const useDoctors = (params?: {
  specialization?: string;
  is_active?: boolean;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorService.getDoctors(params),
  });
};

export const useDoctor = (id: number) => {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctor(id),
    enabled: !!id,
  });
};

export const useDoctorAvailability = (
  id: number,
  params?: { date?: string; start_date?: string; end_date?: string }
) => {
  return useQuery({
    queryKey: ['doctor-availability', id, params],
    queryFn: () => doctorService.getDoctorAvailability(id, params),
    enabled: !!id,
  });
};
