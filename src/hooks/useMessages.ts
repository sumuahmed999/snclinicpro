import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type SendMessageData } from '../services/messages';

export const useMessages = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['messages', params],
    queryFn: () => messageService.getMessages(params),
    // Removed auto-refetch - only refetch when user manually refreshes or navigates to messages page
    // This significantly improves performance by reducing unnecessary API calls
  });
};

export const useMessage = (id: number) => {
  return useQuery({
    queryKey: ['message', id],
    queryFn: () => messageService.getMessage(id),
    enabled: !!id,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => messageService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => messageService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
