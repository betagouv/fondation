import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

const getSessions = () => {
  return apiFetch('/sessions', { method: 'GET' });
};

export const useGetSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions()
  });
};
