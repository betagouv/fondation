import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { ListedMemberSessionsDto, ListMembersData, PaginatedNominationFiles } from '@api/types';
import { sessionKeys } from './nomination-sessions.queries';

export const memberKeys = {
  listMembers: (props: { page?: number; limit?: number; formations?: string[] }) =>
    ['listMembers', props] as const,

  detailsMember: (props: { userId: string | undefined }) => ['detailsMember', props.userId] as const,

  listMemberGdsSessions: (props: { userId: string | undefined }) =>
    ['listMemberGdsSessions', props.userId] as const,

  detailMemberGdsSession: (props: { userId: string | undefined; sessionId: string | undefined }) =>
    ['detailMemberGdsSession', props] as const
};

export const useMemberListQuery = (
  options: {
    search?: string;
    formations?: NonNullable<ListMembersData['query']>['formations'];
    sorting?: { id: string; desc: boolean }[];
    pagination?: { pageIndex: number; pageSize: number };
  } = {}
) =>
  useQuery({
    staleTime: 1_000,
    placeholderData: (prev) => prev,
    queryKey: memberKeys.listMembers(options),
    queryFn: () => {
      let page, limit;
      if (options.pagination) {
        page = options.pagination.pageIndex + 1;
        limit = options.pagination.pageSize;
      }

      let sortBy: 'firstName' | 'lastName' | undefined, sortDirection: 'desc' | undefined;
      if (options.sorting) {
        const [{ id = undefined, desc = undefined } = {}] = options.sorting;
        sortBy = id === 'lastName' ? 'lastName' : id === 'firstName' ? 'firstName' : undefined;
        sortDirection = desc ? 'desc' : undefined;
      }

      return $api.members
        .listMembers({
          query: {
            page,
            limit,
            sortBy,
            sortDirection,
            formations: options.formations ?? [],
            search: options.search?.trim() || undefined
          }
        })
        .then(({ data }) => data ?? null);
    }
  });

export const useDetailedMember = (options: { userId: string | undefined }) =>
  useQuery({
    enabled: !!options.userId,
    queryKey: memberKeys.detailsMember({ userId: options.userId }),
    queryFn: () =>
      $api.members.detailsMember({ path: { userId: options.userId! } }).then(({ data = null }) => data)
  });

export function useExcludedJurisdictionsMutation(options: { userId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jurisdictionIds: readonly string[]) => {
      await $api.members.excludeJurisdictions({
        path: { userId: options.userId },
        body: { jurisdictionIds: jurisdictionIds as string[] }
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: memberKeys.detailsMember({ userId: options.userId }) })
  });
}

export type SessionOfTypeGardeDesSceaux = Omit<ListedMemberSessionsDto['items'][number], 'createdAt'> & {
  createdAt: Date;
};

export function useListMemberGdsSessions(input: { userId: string | undefined }) {
  return useQuery({
    enabled: !!input.userId,
    queryKey: memberKeys.listMemberGdsSessions(input),
    queryFn: async () => {
      if (!input.userId) return null;

      const { data } = await $api.members.listMemberSessions({ path: { userId: input.userId! } });

      if (!data) return null;

      return {
        items: data.items.map<SessionOfTypeGardeDesSceaux>((item) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }))
      };
    }
  });
}

export function useDetailedMemberGdsSession(input: {
  userId: string | undefined;
  sessionId: string | undefined;
}) {
  return useQuery({
    queryKey: memberKeys.detailMemberGdsSession(input),
    enabled: Boolean(input.sessionId && input.userId),
    queryFn: () => {
      if (!input.sessionId || !input.userId) return null;

      return $api.members
        .detailsMemberSession({
          path: { userId: input.userId, sessionId: input.sessionId }
        })
        .then(({ data = null }) => data);
    }
  });
}
export function useUpdateNominationFileCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; comment: string | null }) => {
      await $api.sessions.updateNominationFileComment({
        path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
        body: { comment: mutation.comment }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, comment }) => {
      // Mise à jour optimiste du cache pour l'affichage de l'icône
      queryClient.setQueryData(
        sessionKeys.listSessionNominationFiles({ sessionId }),
        (old: { items: { id: string; comment?: string | null }[] } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) => (file.id === nominationFileId ? { ...file, comment } : file))
          };
        }
      );
    }
  });
}

export function useUpdateCommentAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; userIds: string[] }) => {
      await $api.sessions.updateCommentAccess({
        path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
        body: { userIds: mutation.userIds }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, userIds }) => {
      // Mise à jour optimiste du cache sans refetch
      queryClient.setQueryData(
        sessionKeys.listSessionNominationFiles({ sessionId }),
        (old: { items: { id: string; commentAccessUserIds?: string[] }[] } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) =>
              file.id === nominationFileId ? { ...file, commentAccessUserIds: userIds } : file
            )
          };
        }
      );
    }
  });
}

export function useWriteNominationFileMemberMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { userId: string; sessionId: string; nominationFileId: string; memo: string }) =>
      $api.members.writeNominationFileMemberMemo({
        path: {
          userId: mutation.userId,
          sessionId: mutation.sessionId,
          nominationFileId: mutation.nominationFileId
        },
        body: { memo: mutation.memo }
      }),
    onSuccess: (_, { nominationFileId, sessionId, memo }) =>
      queryClient.setQueryData(
        sessionKeys.listSessionNominationFiles({ sessionId }),
        (old: PaginatedNominationFiles | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) => (item.id === nominationFileId ? { ...item, memo } : item))
          };
        }
      )
  });
}
