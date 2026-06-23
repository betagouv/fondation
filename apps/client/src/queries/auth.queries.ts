import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { HttpException } from '../utils/http-exception';
import * as $api from '@api/sdk';

export const authKeys = {
  introspectSession: () => ['introspectSession'],
  openIdProviders: () => ['auth', 'openidProviders'],
};

export const useUser = () => {
  const { data, ...query } = useQuery({
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1_000,

    queryKey: authKeys.introspectSession(),
    queryFn: () =>
      $api.auth
        .introspectSession()
        .then(({ data }) =>
          data
            ? {
                id: data.userId,
                role: data.role,
                firstName: data.firstName,
                lastName: data.lastName,
                isImpersonated: data.isImpersonated,
                civility: `${data.gender === 'FEMALE' ? 'Madame' : 'Monsieur'} ${data.lastName.toUpperCase()}`,
              }
            : null,
        )
        .catch((err) => {
          if (err instanceof HttpException && err.statusCode === 401) return null;
          throw err;
        }),
  });

  return { ...query, user: data };
};

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.auth.logout(),
    onSuccess: () => queryClient.removeQueries({ queryKey: authKeys.introspectSession() }),
  });
}

export function usePasswordLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { email: string; password: string }) => {
      const authorization = btoa(`${body.email}:${body.password}`);
      return $api.auth.login({ headers: { authorization: `Basic ${authorization}` } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.introspectSession() }),
  });
}

export function useImpersonateMutation(props: { userId: string }) {
  return useMutation({
    mutationFn: () => $api.auth.impersonate({ path: { userId: props.userId } }),
  });
}

export function usePrepareOpenIdLoginMutation(props: { provider: string }) {
  return useMutation({
    mutationFn: () => $api.auth.prepareOpenIdRequest({ path: { provider: props.provider } }),
  });
}

const MINUTES = 1_000 * 60;
export function useListOpenIdProvidersQuery() {
  return useQuery({
    staleTime: 10 * MINUTES,
    queryKey: authKeys.openIdProviders(),
    queryFn: () => $api.auth.listOpenIdProviders().then(({ data = null }) => data),
  });
}
