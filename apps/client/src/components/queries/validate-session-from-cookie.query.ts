import { useQuery } from '@tanstack/react-query';
import { Gender, type IdentityAndAccessRestContract } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

interface User {
  firstName: string;
  gender: string;
  lastName: string;
  role: string;
  userId: string;
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

  const user = {
    firstLetters: `${data?.lastName.charAt(0).toUpperCase()}${data?.firstName.charAt(0).toUpperCase()}`,
    civility: `${data?.gender === Gender.F ? 'Madame' : 'Monsieur'} ${data?.lastName.toUpperCase()}`
  };

  return { user, isPending, isError };
};
