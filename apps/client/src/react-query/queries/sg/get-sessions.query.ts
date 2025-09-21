import { useQuery } from '@tanstack/react-query';
import type { NominationsContextSessionsRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

type Endpoint = NominationsContextSessionsRestContract['endpoints']['sessions'];
type GetSessionsResponse = Endpoint['response'];

const getSessions = () => {
  const url = '/nominations/sessions';
  return apiFetch<GetSessionsResponse>(url, { method: 'GET' });
};

export const useGetSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions()
  });
};
