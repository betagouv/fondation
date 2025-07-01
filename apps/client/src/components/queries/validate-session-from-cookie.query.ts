import { useQuery } from '@tanstack/react-query';
import type { IdentityAndAccessRestContract } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

interface User {
  id: string;
  email: string;
  name?: string;
}

const validateSessionFromCookie = async (): Promise<User> => {
  const {
    method,
    path
  }: IdentityAndAccessRestContract['endpoints']['validateSessionFromCookie'] = {
    method: 'POST',
    path: 'validate-session-from-cookie',
    response: null
  };

  return apiFetch(`/auth/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useValidateSessionFromCookie = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['validateSessionFromCookie'],
    queryFn: validateSessionFromCookie,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  return { data, isPending, isError };
};
