import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import type { AdminUserRoleEnum } from '@/features/administration/labels/admin-user-enum';
import { withValidationError } from '@/utils/validation-error';
import * as $api from '@api/sdk';
import type {
  CreateUserDto,
  DetailedAdminUserDto,
  ListUsersData,
  PaginatedAdminUserListItemDto,
} from '@api/types';

import { docsKeys, officialReportKeys } from './agenda.queries';
import { memberKeys } from './members.queries';

export type AdminUsersFilters = {
  roles?: AdminUserRoleEnum[];
  search?: string;
  statuses?: DetailedAdminUserDto['status'][];
};
export type AdminUsersSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListUsersData['query']>['sortBy']> }];

const adminKeys = {
  all: () => ['admin'] as const,
  allUsers: () => ['admin', 'users'] as const,
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
            statuses: options.filters.statuses,
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

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserDto) =>
      withValidationError(() => $api.administration.createUser({ body, throwOnError: true })).then(
        ({ data }) => data,
      ),
    // the role given may take a title back from another account
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all() });
      queryClient.invalidateQueries({ queryKey: docsKeys.members() });
      queryClient.invalidateQueries({ queryKey: memberKeys.allListedMembers() });
      queryClient.invalidateQueries({ queryKey: officialReportKeys.listSecretaries() });
    },
  });
}

function updateUser(queryClient: QueryClient, userId: string, patch: Partial<DetailedAdminUserDto>) {
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
    onSuccess: () => updateAdminRight(queryClient, userId, true),
  });
}

export function useDemoteUserFromAdmin(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.administration.demoteFromAdmin({ path: { userId } }),
    onSuccess: () => updateAdminRight(queryClient, userId, false),
  });
}

/** the toggle flips at once, while the refetch brings the roles the user may take and the icon of the list */
function updateAdminRight(queryClient: QueryClient, userId: string, isAdmin: boolean) {
  updateUser(queryClient, userId, { isAdmin });
  queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
  queryClient.invalidateQueries({ queryKey: adminKeys.allUsers() });
  queryClient.invalidateQueries({ queryKey: docsKeys.members() });
}

function invalidateUserAccess(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
  queryClient.invalidateQueries({ queryKey: adminKeys.allUsers() });
  queryClient.invalidateQueries({ queryKey: docsKeys.members() });
  queryClient.invalidateQueries({ queryKey: memberKeys.allListedMembers() });
  queryClient.invalidateQueries({ queryKey: officialReportKeys.listSecretaries() });
}

export function useDeactivateUserMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.administration.deactivate({ path: { userId } }),
    onSuccess: () => invalidateUserAccess(queryClient, userId),
  });
}

export function useReactivateUserMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.administration.reactivate({ path: { userId } }),
    onSuccess: () => invalidateUserAccess(queryClient, userId),
  });
}
