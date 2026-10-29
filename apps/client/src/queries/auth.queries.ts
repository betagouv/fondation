import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { HttpException } from '../utils/http-exception';
import { withValidationError } from '../utils/validation-error';
import * as $api from '@api/sdk';
import type { DetailedUserResponseDto } from '@api/types';

export type SessionUser = Pick<
  DetailedUserResponseDto,
  | 'displayedRole'
  | 'email'
  | 'firstName'
  | 'formation'
  | 'isAdmin'
  | 'isImpersonated'
  | 'lastName'
  | 'passwordChange'
  | 'role'
> & { civility: string; id: string };

export const authKeys = {
  introspectSession: () => ['introspectSession'],
  openIdProviders: () => ['auth', 'openidProviders'],
};

export const sessionQueryOptions = queryOptions({
  queryFn: () =>
    $api.auth
      .introspectSession()
      .then(({ data }): SessionUser | null =>
        data
          ? {
              civility: `${data.gender === 'FEMALE' ? 'Madame' : 'Monsieur'} ${data.lastName.toUpperCase()}`,
              displayedRole: data.displayedRole,
              email: data.email,
              firstName: data.firstName,
              formation: data.formation,
              id: data.userId,
              isAdmin: data.isAdmin,
              isImpersonated: data.isImpersonated,
              lastName: data.lastName,
              passwordChange: data.passwordChange,
              role: data.role,
            }
          : null,
      )
      .catch((err) => {
        if (err instanceof HttpException && err.statusCode === 401) return null;
        throw err;
      }),
  queryKey: authKeys.introspectSession(),
  refetchOnWindowFocus: false,
  staleTime: 10 * 60 * 1_000,
});

export const useUser = () => {
  const { data, ...query } = useQuery(sessionQueryOptions);

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
      // btoa only takes Latin-1 characters, while the server reads the credentials in UTF-8
      const credentials = new TextEncoder().encode(`${body.email}:${body.password}`);
      const authorization = btoa(String.fromCharCode(...credentials));
      return $api.auth.login({ headers: { authorization: `Basic ${authorization}` } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.introspectSession() }),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      withValidationError(() => $api.auth.changePassword({ body })),
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
    queryFn: () => $api.auth.listOpenIdProviders().then(({ data = null }) => data),
    queryKey: authKeys.openIdProviders(),
    staleTime: 10 * MINUTES,
  });
}
