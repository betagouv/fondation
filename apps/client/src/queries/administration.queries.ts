import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RoleEnum } from '@/types/enums.types';
import * as $api from '@api/sdk';
import type { DetailedAdminUserDto } from '@api/types';

export const adminKeys = {
  users: (params: { search?: string; page?: number; pageSize?: number }) =>
    ['admin', 'users', params] as const,
  user: (userId: string | undefined) => ['admin', 'user', userId] as const
};

export function useAdminUsersQuery(params: {
  search?: string;
  roles?: RoleEnum[];
  pagination: { pageIndex: number; pageSize: number };
  sorting: [{ sortBy: 'lastName'; sortDesc: boolean }] | [];
}) {
  return useQuery({
    staleTime: 1_000,
    placeholderData: (prev) => prev,
    queryKey: adminKeys.users(params),
    queryFn: () =>
      $api.administration
        .listUsers({
          query: {
            sortBy: params.sorting[0]?.sortBy,
            sortDesc: params.sorting[0]?.sortDesc,
            search: params.search?.trim() || undefined,
            page: params.pagination.pageIndex + 1,
            limit: params.pagination.pageSize,
            roles: params.roles
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
      $api.administration.detailsUser({ path: { userId: userId! } }).then(({ data = null }) => data)
  });
}

function updateUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<DetailedAdminUserDto>
) {
  queryClient.setQueryData(adminKeys.user(userId), (data: DetailedAdminUserDto | undefined) =>
    data ? { ...data, ...patch } : data
  );
}

export function useUpdateUserEmailMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string }) => $api.administration.updateEmail({ path: { userId }, body }),
    onSuccess: (_, { email }) => updateUser(queryClient, userId, { email })
  });
}

export function useUpdateUserPasswordMutation(userId: string) {
  return useMutation({
    mutationFn: (body: { password: string }) => $api.administration.updatePassword({ path: { userId }, body })
  });
}

export function useUpdateUserRoleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { role: RoleEnum }) => $api.administration.updateRole({ path: { userId }, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
  });
}

export function useUpdateUserTitleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: 'PRESIDENT_SIEGE' | 'PRESIDENT_PARQUET' | 'FIRST_SECRETARY' | null }) =>
      $api.administration.updateTitle({
        path: { userId },
        body: { title: body.title as DetailedAdminUserDto['title'] }
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
  });
}

export function useUpdateUserDutyMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { duty: 'PRESIDENT' | 'SECRETARY' | 'OFFICER' | null }) =>
      $api.administration.updateDuty({
        path: { userId },
        body: { duty: body.duty as DetailedAdminUserDto['duty'] }
      }),
    onSuccess: (_, { duty }) =>
      updateUser(queryClient, userId, { duty: duty as DetailedAdminUserDto['duty'] })
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
