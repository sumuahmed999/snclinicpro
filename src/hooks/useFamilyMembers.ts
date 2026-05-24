import { useQuery } from '@tanstack/react-query';
import { familyMemberService } from '../services/familyMembers';

export const useFamilyMembers = () => {
  return useQuery({
    queryKey: ['family-members'],
    queryFn: () => familyMemberService.getFamilyMembers(),
  });
};
