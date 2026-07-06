import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PrioriteEnum, ReportStatusEnum } from '@/types/enums.types';
import * as $api from '@api/sdk';
import type {
  DetailedMemberDto,
  ListedMemberSessionsDto,
  ListMembersData,
  PaginatedNominationFiles,
} from '@api/types';

import { docsKeys } from './agenda.queries';
import { sessionKeys } from './nomination-sessions.queries';
import { summaryKeys } from './summary.queries';

export const memberKeys = {
  listMembers: (props: { page?: number; limit?: number; formations?: string[] }) =>
    ['listMembers', props] as const,

  detailsMember: (props: { userId: string | undefined }) => ['detailsMember', props.userId] as const,

  listMemberGdsSessions: (props: { userId: string | undefined }) =>
    ['listMemberGdsSessions', props.userId] as const,

  detailMemberGdsSession: (props: {
    userId: string | undefined;
    sessionId: string | undefined;
    [k: string]: unknown;
  }) => {
    const { userId, sessionId, ...rest } = props;
    return ['detailMemberGdsSession', userId, sessionId, rest] as const;
  },
};

export const useMemberListQuery = (
  options: {
    search?: string;
    formations?: NonNullable<ListMembersData['query']>['formations'];
    sorting?: { id: string; desc: boolean }[];
    pagination?: { pageIndex: number; pageSize: number };
  } = {},
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
        const [{ id, desc } = {}] = options.sorting;
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
            search: options.search?.trim() || undefined,
          },
        })
        .then(({ data }) => data ?? null);
    },
  });

export const useDetailedMember = (options: { userId: string | undefined }) =>
  useQuery({
    enabled: !!options.userId,
    queryKey: memberKeys.detailsMember({ userId: options.userId }),
    queryFn: () =>
      $api.members.detailsMember({ path: { userId: options.userId! } }).then(({ data = null }) => data),
  });

export function useUpdateTitleMutation(options: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE' | null) =>
      $api.members.updateTitle({
        path: { userId: options.userId },
        body: { title: title as 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE' },
      }),

    onSuccess: (_data, title) => {
      queryClient.setQueryData(
        memberKeys.detailsMember({ userId: options.userId }),
        (data: DetailedMemberDto | undefined) => {
          if (!data) return data;

          return {
            ...data,
            title,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: docsKeys.members() });
    },
  });
}

export const useUpdateDisplayTitleMutation = (options: { userId: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayTitle: string | null) =>
      $api.members.updateDisplayTitle({
        path: { userId: options.userId },
        body: { displayTitle },
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: docsKeys.members() }),
  });
};

export function useExcludedJurisdictionsMutation(options: { userId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jurisdictionIds: readonly string[]) => {
      await $api.members.excludeJurisdictions({
        path: { userId: options.userId },
        body: { jurisdictionIds: jurisdictionIds as string[] },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: memberKeys.detailsMember({ userId: options.userId }),
      }),
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
          createdAt: new Date(item.createdAt),
        })),
      };
    },
  });
}

export function useDetailedMemberGdsSession(input: {
  userId: string | undefined;
  sessionId: string | undefined;

  status: ReportStatusEnum[] | undefined;
  priorities: (PrioriteEnum | null)[] | undefined;
  pagination: { pageIndex: number; pageSize: number };
  sorting: { id: 'name' | 'fileNumber' | 'targetedPosition' | 'targetedGrade'; desc: boolean }[];
}) {
  return useQuery({
    queryKey: memberKeys.detailMemberGdsSession(input),
    enabled: Boolean(input.sessionId && input.userId),
    placeholderData: (prev) => prev,
    queryFn: () => {
      if (!input.sessionId || !input.userId) return null;

      return $api.members
        .detailsMemberSession({
          path: { userId: input.userId, sessionId: input.sessionId },
          query: {
            status: input.status?.join(','),
            priorities: input.priorities?.join(','),
            page: input.pagination.pageIndex + 1,
            limit: input.pagination.pageSize,
            sortBy: input.sorting[0]?.id,
            sortDesc: input.sorting[0]?.desc,
          },
        })
        .then(({ data = null }) => data);
    },
  });
}
export function useUpdateNominationFileCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; comment: string | null }) => {
      await $api.sessions.updateNominationFileComment({
        path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
        body: { comment: mutation.comment },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, comment }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        (old: { items: { id: string; comment?: string | null }[] } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) => (file.id === nominationFileId ? { ...file, comment } : file)),
          };
        },
      );
    },
  });
}

export function useUpdateNominationFileAuditionDateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      nominationFileId: string;
      auditionDate: string | null;
    }) => {
      await $api.sessions.updateNominationFileAuditionDate({
        path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
        body: { auditionDate: mutation.auditionDate },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, auditionDate }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        (old: { items: { id: string; auditionDate?: string | null }[] } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) => (file.id === nominationFileId ? { ...file, auditionDate } : file)),
          };
        },
      );

      queryClient.setQueryData(
        summaryKeys.detailsSummary({ sessionId, nominationFileId }),
        (old: { auditionDate: string | null } | undefined) => (old ? { ...old, auditionDate } : old),
      );
    },
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
          nominationFileId: mutation.nominationFileId,
        },
        body: { memo: mutation.memo },
      }),
    onSuccess: (_, { nominationFileId, sessionId, memo }) =>
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        (old: PaginatedNominationFiles | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) => (item.id === nominationFileId ? { ...item, memo } : item)),
          };
        },
      ),
  });
}
