import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import type { AdminUserRoleEnum } from '@/features/administration/labels/admin-user-enum';
import * as $api from '@api/sdk';
import type { DetailedAdminUserDto, ListUsersData, PaginatedAdminUserListItemDto } from '@api/types';

import { docsKeys } from './agenda.queries';

export type AdminUsersFilters = { roles?: AdminUserRoleEnum[]; search?: string };
export type AdminUsersSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListUsersData['query']>['sortBy']> }];

const adminKeys = {
  user: (userId: string | undefined) => ['admin', 'user', userId] as const,
  users: (params: { filters: AdminUsersFilters; sorting: AdminUsersSorting }) =>
    ['admin', 'users', params] as const,
};

const ADMIN_USERS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectAdminUsers(data: InfiniteData<PaginatedAdminUserListItemDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export function useInfiniteAdminUsersQuery(options: {
  filters: AdminUsersFilters;
  sorting: AdminUsersSorting;
}) {
  return useInfiniteQuery({
    getNextPageParam: (lastPage: PaginatedAdminUserListItemDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.administration
        .listUsers({
          query: {
            limit: ADMIN_USERS_PAGE_SIZE,
            page: pageParam,
            roles: options.filters.roles,
            search: options.filters.search?.trim() || undefined,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
          },
        })
        .then(({ data }) => data ?? null),
    queryKey: adminKeys.users(options),
    select: selectAdminUsers,
    staleTime: 1_000,
  });
}

export function useAdminUserDetailQuery(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryFn: () =>
      $api.administration.detailsUser({ path: { userId: userId! } }).then(({ data = null }) => data),
    queryKey: adminKeys.user(userId),
  });
}

function updateUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<DetailedAdminUserDto>,
) {
  queryClient.setQueryData(adminKeys.user(userId), (data: DetailedAdminUserDto | undefined) =>
    data ? { ...data, ...patch } : data,
  );
}

export function useUpdateUserEmailMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string }) => $api.administration.updateEmail({ body, path: { userId } }),
    onSuccess: (_, { email }) => updateUser(queryClient, userId, { email }),
  });
}

export function useUpdateUserPasswordMutation(userId: string) {
  return useMutation({
    mutationFn: (body: { password: string }) =>
      $api.administration.updatePassword({ body, path: { userId } }),
  });
}

export function useUpdateUserRoleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { role: AdminUserRoleEnum }) =>
      $api.administration.updateRole({ body, path: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: docsKeys.members() });
    },
  });
}

export function useUpdateUserDisplayTitleMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayTitle: string | null }) =>
      $api.administration.updateDisplayTitle({ body, path: { userId } }),
    onSuccess: (_, { displayTitle }) => updateUser(queryClient, userId, { displayTitle }),
  });
}

export function usePromoteUserToAdmin(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.administration.promoteToAdmin({ path: { userId } }),
    onSuccess: () => {
      updateUser(queryClient, userId, { isAdmin: true });
      queryClient.invalidateQueries({ queryKey: docsKeys.members() });
    },
  });
}

export function useDemoteUserFromAdmin(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.administration.demoteFromAdmin({ path: { userId } }),
    onSuccess: () => {
      updateUser(queryClient, userId, { isAdmin: false });
      queryClient.invalidateQueries({ queryKey: docsKeys.members() });
    },
  });
}
