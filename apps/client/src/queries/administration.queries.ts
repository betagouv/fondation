import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { DetailedAdminUserDto } from '@api/types';

export const adminKeys = {
  users: (params: { search?: string; page?: number; pageSize?: number }) =>
    ['admin', 'users', params] as const,
  user: (userId: string | undefined) => ['admin', 'user', userId] as const
};

export function useAdminUsersQuery(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    staleTime: 1_000,
    placeholderData: (prev) => prev,
    queryKey: adminKeys.users(params),
    queryFn: () =>
      $api.administration
        .listUsers({
          query: {
            search: params.search?.trim() || undefined,
            page: params.page,
            limit: params.pageSize
          }
        })
        .then(({ data }) => data ?? null)
  });
}

export function useAdminUserDetailQuery(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: adminKeys.user(userId),
    queryFn: () =>
      $api.administration
        .detailsUser({ path: { userId: userId! } })
        .then(({ data = null }) => data)
  });
}

function updateUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<DetailedAdminUserDto>
) {
  queryClient.setQueryData(
    adminKeys.user(userId),
    (data: DetailedAdminUserDto | undefined) => (data ? { ...data, ...patch } : data)
  );
}

export function useUpdateUserEmailMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string }) =>
      $api.administration.updateEmail({ path: { userId }, body }),
    onSuccess: (_, { email }) => updateUser(queryClient, userId, { email })
  });
}

export function useUpdateUserPasswordMutation(userId: string) {
  return useMutation({
    mutationFn: (body: { password: string }) =>
      $api.administration.updatePassword({ path: { userId }, body })
  });
}

export function useUpdateUserRoleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      role: 'MEMBRE_DU_SIEGE' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_COMMUN' | 'ADJOINT_SECRETAIRE_GENERAL' | 'ADMIN';
    }) => $api.administration.updateRole({ path: { userId }, body }),
    onSuccess: (_, { role }) => updateUser(queryClient, userId, { role })
  });
}

export function useUpdateUserTitleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: 'PRESIDENT_SIEGE' | 'PRESIDENT_PARQUET' | 'FIRST_SECRETARY' }) =>
      $api.administration.updateTitle({ path: { userId }, body }),
    onSuccess: (_, { title }) => updateUser(queryClient, userId, { title })
  });
}

export function useUpdateUserDutyMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { duty: 'PRESIDENT' | 'SECRETARY' | 'OFFICER' }) =>
      $api.administration.updateDuty({ path: { userId }, body }),
    onSuccess: (_, { duty }) => updateUser(queryClient, userId, { duty })
  });
}

export function useUpdateUserDisplayTitleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayTitle: string | null }) =>
      $api.administration.updateDisplayTitle({ path: { userId }, body }),
    onSuccess: (_, { displayTitle }) => updateUser(queryClient, userId, { displayTitle })
  });
}
