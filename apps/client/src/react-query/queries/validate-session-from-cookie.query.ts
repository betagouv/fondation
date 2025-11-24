import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gender, Role } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

const introspectSession = () =>
  apiFetch<{ id: string; firstName: string; lastName: string; role: Role; gender: Gender }>(
    `/auth/v2/introspect`,
    { method: 'GET' }
  );

export const useValidateSessionFromCookie = () => {
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['introspectSession'],
    queryFn: introspectSession,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: 0,
    staleTime: 0,
    placeholderData: undefined
  });

  const user = data
    ? {
        firstLetters: `${data.lastName.charAt(0).toUpperCase()}${data.firstName.charAt(0).toUpperCase()}`,
        civility: `${data.gender === Gender.F ? 'Madame' : 'Monsieur'} ${data.lastName.toUpperCase()}`,
        role: data.role as Role
      }
    : null;

  const invalidateSession = () => {
    queryClient.removeQueries({ queryKey: ['validateSessionFromCookie'] });
  };

  return { user, isPending, isError, refetch, invalidateSession };
};
