import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type {
  DetailedMemberDto,
  DetailedSummaryDto,
  ListedMemberSessionsDto,
  ListMembersData,
  UpdateAuditionDateDto,
  UpdateAuditionRequestDto,
  UpdateMissingEvaluationCommentDto,
  UpdateMissingEvaluationDto,
} from '@api/types';

import { docsKeys } from './agenda.queries';
import { auditionKeys } from './auditions.queries';
import { mapCachedNominationFiles, sessionKeys } from './nomination-sessions.queries';
import { summaryKeys } from './summary.queries';

export type ListMembersOptions = {
  formations?: NonNullable<ListMembersData['query']>['formations'];
  pagination?: { pageIndex: number; pageSize: number };
  search?: string;
  sorting?: { id: string; desc: boolean }[];
};

export const memberKeys = {
  allListMemberSessionReports: () => ['listMemberSessionReports'] as const,

  allListedMembers: () => ['listMembers'] as const,

  detailsMember: (props: { userId: string | undefined }) => ['detailsMember', props.userId] as const,

  listMemberGdsSessions: (props: { userId: string | undefined }) =>
    ['listMemberGdsSessions', props.userId] as const,

  listMemberSessionReports: (props: { sessionId: string | undefined; userId: string | undefined }) =>
    ['listMemberSessionReports', props.userId, props.sessionId] as const,

  listMembers: (props: ListMembersOptions) => ['listMembers', props] as const,
};

export const useMemberListQuery = ({
  enabled,
  ...options
}: ListMembersOptions & { enabled?: boolean } = {}) =>
  useQuery({
    enabled,
    placeholderData: (prev) => prev,
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
            formations: options.formations ?? [],
            limit,
            page,
            search: options.search?.trim() || undefined,
            sortBy,
            sortDirection,
          },
        })
        .then(({ data }) => data ?? null);
    },
    queryKey: memberKeys.listMembers(options),
    staleTime: 1_000,
  });

export const useDetailedMember = (options: { userId: string | undefined }) =>
  useQuery({
    enabled: !!options.userId,
    queryFn: () =>
      $api.members.detailsMember({ path: { userId: options.userId! } }).then(({ data = null }) => data),
    queryKey: memberKeys.detailsMember({ userId: options.userId }),
  });

export function useUpdateTitleMutation(options: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE' | null) =>
      $api.members.updateTitle({
        body: { title: title as 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE' },
        path: { userId: options.userId },
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
        body: { displayTitle },
        path: { userId: options.userId },
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: docsKeys.members() }),
  });
};

export function useExcludedJurisdictionsMutation(options: { userId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jurisdictionIds: readonly string[]) => {
      await $api.members.excludeJurisdictions({
        body: { jurisdictionIds: jurisdictionIds as string[] },
        path: { userId: options.userId },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: memberKeys.detailsMember({ userId: options.userId }),
      });
      await queryClient.invalidateQueries({ queryKey: memberKeys.allListedMembers() });
    },
  });
}

export type SessionOfTypeGardeDesSceaux = Omit<ListedMemberSessionsDto['items'][number], 'createdAt'> & {
  createdAt: Date;
};

export function useListMemberGdsSessions(input: { userId: string | undefined }) {
  return useQuery({
    enabled: !!input.userId,
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
    queryKey: memberKeys.listMemberGdsSessions(input),
  });
}

export function useListMemberSessionReports(input: {
  sessionId: string | undefined;
  userId: string | undefined;
}) {
  return useQuery({
    enabled: Boolean(input.sessionId && input.userId),
    queryFn: async () => {
      if (!input.sessionId || !input.userId) return null;

      const { data } = await $api.members.listMemberSessionReports({
        path: { sessionId: input.sessionId, userId: input.userId },
      });

      return data ?? null;
    },
    queryKey: memberKeys.listMemberSessionReports(input),
  });
}

export function useUpdateNominationFileCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; comment: string | null }) => {
      await $api.sessions.updateNominationFileComment({
        body: { comment: mutation.comment },
        path: { nominationFileId: mutation.nominationFileId, sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, comment }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((file) => (file.id === nominationFileId ? { ...file, comment } : file)),
      );
    },
  });
}

export function useUpdateNominationFileAuditionDateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: UpdateAuditionDateDto & { sessionId: string; nominationFileId: string }) => {
      await $api.sessions.updateNominationFileAuditionDate({
        body: { auditionDate: mutation.auditionDate, auditionTime: mutation.auditionTime },
        path: { nominationFileId: mutation.nominationFileId, sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, auditionDate, auditionTime }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((file) =>
          file.id === nominationFileId
            ? {
                ...file,
                auditionDate,
                auditionTime: auditionTime
                  ? {
                      hours: auditionTime.hours,
                      minutes: auditionTime.minutes ?? 0,
                      seconds: auditionTime.seconds ?? 0,
                    }
                  : null,
              }
            : file,
        ),
      );

      queryClient.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId, sessionId }),
        (old: DetailedSummaryDto | undefined) => (old ? { ...old, auditionDate, auditionTime } : old),
      );

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detailSessionNominationFile({ nominationFileId, sessionId }),
        }),
      ]);
    },
  });
}

export function useUpdateNominationFileAuditionRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      mutation: UpdateAuditionRequestDto & { nominationFileId: string; sessionId: string },
    ) => {
      await $api.sessions.updateNominationFileAuditionRequest({
        body: { requested: mutation.requested },
        path: { nominationFileId: mutation.nominationFileId, sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { nominationFileId, requested, sessionId }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((file) =>
          file.id === nominationFileId
            ? {
                ...file,
                auditionDate: requested ? file.auditionDate : null,
                auditionRequired: requested,
                // the toggle is locked where the position sets the audition: only the secretariat adds one
                auditionRequirement: requested ? 'SECRETARIAT' : null,
                auditionTime: requested ? file.auditionTime : null,
              }
            : file,
        ),
      );

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detailSessionNominationFile({ nominationFileId, sessionId }),
        }),
        queryClient.invalidateQueries({
          queryKey: summaryKeys.detailsSummary({ nominationFileId, sessionId }),
        }),
      ]);
    },
  });
}

export function useUpdateNominationFileMissingEvaluationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      mutation: UpdateMissingEvaluationDto & { sessionId: string; nominationFileId: string },
    ) => {
      await $api.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: mutation.missingEvaluation },
        path: { nominationFileId: mutation.nominationFileId, sessionId: mutation.sessionId },
      });
    },
    onSuccess: async (_, { sessionId, nominationFileId, missingEvaluation }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((file) =>
          file.id === nominationFileId
            ? {
                ...file,
                missingEvaluation,
                missingEvaluationComment: missingEvaluation ? file.missingEvaluationComment : null,
              }
            : file,
        ),
      );

      queryClient.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId, sessionId }),
        (old: DetailedSummaryDto | undefined) => (old ? { ...old, missingEvaluation } : old),
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sessionKeys.listSessionNominationFiles({ sessionId }),
        }),
        queryClient.invalidateQueries({
          queryKey: sessionKeys.nominationFilesStatusCounts({ sessionId }),
        }),
      ]);
    },
  });
}

export function useUpdateNominationFileMissingEvaluationCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      mutation: UpdateMissingEvaluationCommentDto & { sessionId: string; nominationFileId: string },
    ) => {
      await $api.sessions.updateNominationFileMissingEvaluationComment({
        body: { comment: mutation.comment },
        path: { nominationFileId: mutation.nominationFileId, sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, comment }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((file) =>
          file.id === nominationFileId ? { ...file, missingEvaluationComment: comment } : file,
        ),
      );

      return queryClient.invalidateQueries({
        queryKey: sessionKeys.nominationFilesStatusCounts({ sessionId }),
      });
    },
  });
}

export function useWriteNominationFileMemberMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { userId: string; sessionId: string; nominationFileId: string; memo: string }) =>
      $api.members.writeNominationFileMemberMemo({
        body: { memo: mutation.memo },
        path: {
          nominationFileId: mutation.nominationFileId,
          sessionId: mutation.sessionId,
          userId: mutation.userId,
        },
      }),
    onSuccess: (_, { nominationFileId, sessionId, memo }) =>
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((item) => (item.id === nominationFileId ? { ...item, memo } : item)),
      ),
  });
}
