import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gender, Role, type IdentityAndAccessRestContract } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';

type Endpoint = IdentityAndAccessRestContract['endpoints']['validateSessionFromCookie'];
type ValidateSessionFromCookieResponse = Endpoint['response'];

const validateSessionFromCookie = async () => {
  const { method, path }: Endpoint = {
    method: 'POST',
    path: 'validate-session-from-cookie',
    response: null
  };

  return apiFetch<ValidateSessionFromCookieResponse>(`/auth/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useValidateSessionFromCookie = () => {
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['validateSessionFromCookie'],
    queryFn: validateSessionFromCookie,
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
