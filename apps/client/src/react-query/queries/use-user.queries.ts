import { useQuery } from '@tanstack/react-query';
import { Gender, Role } from 'shared-models';
import { apiFetch, HttpException } from '../../utils/api-fetch.utils';

const introspectSession = () =>
  apiFetch<{ userId: string; firstName: string; lastName: string; role: Role; gender: Gender }>(
    `/auth/v2/introspect`,
    { method: 'GET', credentials: 'include' }
  );

export const useUser = () => {
  const { data, ...query } = useQuery({
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: 0,
    staleTime: 10_000,
    placeholderData: undefined,

    queryKey: ['introspectSession'],
    queryFn: () =>
      introspectSession()
        .then((data) =>
          data
            ? {
                id: data.userId,
                role: data.role,
                firstLetters: `${data.lastName.charAt(0).toUpperCase()}${data.firstName.charAt(0).toUpperCase()}`,
                civility: `${data.gender === Gender.F ? 'Madame' : 'Monsieur'} ${data.lastName.toUpperCase()}`
              }
            : null
        )
        .catch((err) => {
          if (err instanceof HttpException && err.statusCode === 401) return null;
          throw err;
        })
  });

  return { ...query, user: data };
};
