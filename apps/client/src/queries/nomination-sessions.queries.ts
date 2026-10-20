import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import type { FormationEnum } from '@/shared/enums/formation.enum';
import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import { HttpException } from '@/utils/http-exception';
import { multipartJson } from '@/utils/multipart-json';
import * as $api from '@api/sdk';
import type {
  AffectReportersDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListedNominationFileAttachmentDto,
  ListedNominationSessionsDto,
  ListNominationFilesData,
  ListSessionsOfTypeGardeDesSceauxData,
  PaginatedNominationFiles,
  UpdateNominationFilesPrioritiesDto,
  UploadNominationFileAttachmentsDto,
} from '@api/types';

import { agendaKeys, officialReportKeys, presentationPlanKeys } from './agenda.queries';
import { archivedSessionKeys } from './archived-nomination-sessions.queries';

type NonNullableKey<Parts extends unknown[], Rest extends unknown[] = []> = Parts extends never[]
  ? Rest
  : Parts extends [infer Head, ...infer Tail]
    ? Head extends undefined | null
      ? NonNullableKey<Tail, Rest>
      : Head extends Record<string, never>
        ? NonNullableKey<Tail, Rest>
        : NonNullableKey<Tail, [...Rest, Head]>
    : Rest;

function key<const Parts extends unknown[]>(...parts: Parts): NonNullableKey<Parts> {
  return parts.filter((x): x is NonNullable<typeof x> => {
    if (x === undefined || x === null) return false;

    if (typeof x === 'object') return Object.keys(x).length > 0;
    return true;
  }) as NonNullableKey<Parts>;
}

export type GdsSessionsFilters = { formations?: FormationEnum[] };
export type GdsSessionsSorting =
  | []
  | [
      {
        desc: boolean;
        id: NonNullable<NonNullable<ListSessionsOfTypeGardeDesSceauxData['query']>['sortBy']>;
      },
    ];

export const sessionKeys = {
  countUnaffectedFiles: (props?: { sessionId: string }) =>
    key('sessions', 'countUnaffectedFiles', props?.sessionId),
  countUsersNewSessions: () => key('sessions', 'countUsersNewSessions'),
  // under the version it tells the story of, so whatever refreshes the version refreshes it too
  detailAffectationHistory: (props: { sessionId: string }) =>
    key('sessions', 'detailSessionAffectationVersion', props.sessionId, 'history'),
  detailSession: (props?: { sessionId: string | undefined }) =>
    key('sessions', 'detailSession', props?.sessionId),
  detailSessionAffectationVersion: (props?: { sessionId: string }) =>
    key('sessions', 'detailSessionAffectationVersion', props?.sessionId),
  detailSessionComment: (props: { sessionId: string }) =>
    key('sessions', 'detailSessionComment', props.sessionId),
  detailSessionNominationFile: (props: {
    nominationFileId: string | undefined;
    sessionId: string | undefined;
  }) => key('sessions', 'detailSessionNominationFile', props.sessionId, props.nominationFileId),
  listCurrentlyAffectedReporters: (props?: { sessionId: string }) =>
    key('sessions', 'listCurrentlyAffectedReporters', props?.sessionId),
  listGdsSessions: (props?: { filters: GdsSessionsFilters; sorting: GdsSessionsSorting }) =>
    key('sessions', 'listGdsSessions', props),
  listNominationFileAttachments: (props: { nominationFileId: string; sessionId: string }) =>
    key('sessions', 'listNominationFileAttachments', props.sessionId, props.nominationFileId),
  listSessionAttachments: (props: { sessionId: string }) =>
    key('sessions', 'listSessionAttachments', props.sessionId),
  listSessionNominationFiles: (props?: { sessionId: string; [k: string]: unknown }) => {
    const { sessionId, ...rest } = props ?? {};
    return key('sessions', 'listSessionNominationFiles', sessionId, rest);
  },
  lolfiMagistratUrl: (props?: { nominationFileId?: string; sessionId: string }) =>
    key('sessions', 'lolfiMagistratUrl', props?.sessionId, props?.nominationFileId),
  nominationFilesStatusCounts: (props?: { sessionId: string }) =>
    key('sessions', 'nominationFilesStatusCounts', props?.sessionId),
};

const doesQueryKey = {
  matchesAny:
    (...keys: (readonly unknown[])[]) =>
    ({ queryKey }: { queryKey: readonly unknown[] }) =>
      keys.some((key) =>
        key.every((x, i) =>
          typeof queryKey[i] === 'string' || typeof queryKey[i] === 'number'
            ? queryKey[i] === x
            : JSON.stringify(queryKey[i]) === JSON.stringify(x),
        ),
      ),
} as const;

export const useDetailedNominationSessionAffectationsVersionQuery = (sessionId: string) =>
  useQuery({
    queryFn: () =>
      $api.sessions
        .detailNominationSessionAffectationsVersion({ path: { sessionId } })
        .then(({ data = null }) => data),
    queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId }),
  });

export const useDetailAffectationHistoryQuery = (sessionId: string) =>
  useQuery({
    queryFn: () =>
      $api.sessions.detailAffectationHistory({ path: { sessionId } }).then(({ data = null }) => data),
    queryKey: sessionKeys.detailAffectationHistory({ sessionId }),
  });

export type SessionNominationFile = PaginatedNominationFiles['items'][number];
export type SessionNominationFileStatus = SessionNominationFile['content']['status'];
export type SessionNominationFileLockedReason = SessionNominationFile['content']['lockedReason'];

export function isUpdatable(file: SessionNominationFile): boolean {
  return file.content.lockedReason === null;
}

const SESSION_NOMINATION_FILES_PAGE_SIZE = 100;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectSessionNominationFiles(data: InfiniteData<PaginatedNominationFiles | null>) {
  return {
    items: data.pages.filter((page) => !!page).flatMap((page) => page.items),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export type SessionNominationFilesFilters = {
  missingEvaluation?: boolean;
  nominationFileIds?: readonly string[];
  outcomes?: (NominationFileOutcomeEnum | null)[];
  priorities?: (PrioriteEnum | 'null')[];
  reporterIds?: string[];
  search?: string | null;
};

export const useInfiniteSessionNominationFilesQuery = (options: {
  filters: SessionNominationFilesFilters | undefined;
  sessionId: string;
  sorting: [] | [{ desc: boolean; id: NonNullable<ListNominationFilesData['query']>['sortBy'] }] | undefined;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: PaginatedNominationFiles | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (prev) => prev,
    queryFn: ({ pageParam }) => {
      return $api.sessions
        .listNominationFiles({
          path: { sessionId: options.sessionId },
          query: {
            limit: SESSION_NOMINATION_FILES_PAGE_SIZE,
            missingEvaluation: options.filters?.missingEvaluation,
            nominationFileIds: options.filters?.nominationFileIds
              ? [...options.filters.nominationFileIds]
              : undefined,
            outcomes: options.filters?.outcomes?.join(','),
            page: pageParam,
            priorities: options.filters?.priorities,
            reporterIds: options.filters?.reporterIds,
            search: options.filters?.search?.trim() || undefined,
            sortBy: options.sorting?.[0]?.id,
            sortDesc: options.sorting?.[0]?.desc ? 'true' : undefined,
          },
        })
        .then(({ data = null }) => data);
    },
    queryKey: sessionKeys.listSessionNominationFiles(options),
    select: selectSessionNominationFiles,
    staleTime: 30_000,
  });

export const useSessionNominationFileQuery = (options: {
  enabled: boolean;
  nominationFileId: string | undefined;
  sessionId: string | undefined;
}) =>
  useQuery({
    enabled: options.enabled && !!options.nominationFileId && !!options.sessionId,
    queryFn: async () => {
      if (!options.nominationFileId || !options.sessionId) return null;

      const { data } = await $api.sessions.detailNominationFile({
        path: { nominationFileId: options.nominationFileId, sessionId: options.sessionId },
      });

      return data ?? null;
    },
    queryKey: sessionKeys.detailSessionNominationFile(options),
    staleTime: 30_000,
  });

export const mapCachedNominationFiles =
  (mapItem: (item: SessionNominationFile) => SessionNominationFile) =>
  (old: InfiniteData<PaginatedNominationFiles | null> | undefined) => {
    if (!old) return old;

    return {
      ...old,
      pages: old.pages.map((page) => (page ? { ...page, items: page.items.map(mapItem) } : page)),
    };
  };

export function useAffectNominationFilesReportersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      affectations: readonly AffectReportersDto['items'][number][];
      sessionId: string;
    }): Promise<void> => {
      await $api.sessions.affectReporters({
        body: { items: [...mutation.affectations] },
        path: { sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId }),
          sessionKeys.countUnaffectedFiles({ sessionId }),
          sessionKeys.nominationFilesStatusCounts({ sessionId }),
          sessionKeys.listCurrentlyAffectedReporters({ sessionId }),
        ),
      }),
  });
}

export function useUpdateNominationFilesPrioritiesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      items: readonly UpdateNominationFilesPrioritiesDto['items'][number][];
      sessionId: string;
    }): Promise<void> => {
      await $api.sessions.updateNominationFilesPriorities({
        body: { items: [...mutation.items] },
        path: { sessionId: mutation.sessionId },
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) }),
  });
}

export function usePublishVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string }): Promise<void> => {
      await $api.sessions.publishNominationSessionAffectationsVersion({
        path: { sessionId: mutation.sessionId },
      });
    },

    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId }),
          agendaKeys.findAgendaNominationFiles({ sessionId }),
          officialReportKeys.all(),
        ),
      }),
  });
}

export function useAutoAffectationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { excludedMemberIds: string[] | undefined; sessionId: string }) =>
      $api.sessions.autoAffectation({
        body: { excludedMemberIds: mutation.excludedMemberIds },
        path: { sessionId: mutation.sessionId },
      }),

    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId }),
          sessionKeys.countUnaffectedFiles({ sessionId }),
          sessionKeys.nominationFilesStatusCounts({ sessionId }),
          sessionKeys.listCurrentlyAffectedReporters({ sessionId }),
        ),
      }),
  });
}

export const useCreateNominationSessionFromLodamMutation = () =>
  useMutation({
    mutationFn: async (input: {
      date: string;
      dueDate?: string | null | undefined;
      file: File;
      formation: FormationEnum;
      name: string;
      observationClosingDate: string;
      positionStartDate?: string | null | undefined;
    }) => {
      const { file, ...form } = input;
      try {
        const { data = null } = await $api.sessions.createSessionFromLodam({
          body: {
            file,
            form: multipartJson(form satisfies ImportNominationSessionFromLodamXlsxDto['form']),
          },
        });
        return data;
      } catch (err) {
        if (err instanceof HttpException && err.statusCode === 400) {
          const body = await err.response.json().catch(() => null);
          if (body) throw Object.assign(new Error(), { validationErrors: body.validationErrors });
        }

        throw err;
      }
    },
  });

export function useAddNominationSessionAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { files: readonly File[] | FileList; sessionId: string }) => {
      if (input.files.length === 0) return;

      await $api.sessions.uploadSessionAttachments({
        body: { files: [...input.files] },
        path: { sessionId: input.sessionId },
      });
    },
    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: sessionKeys.listSessionAttachments({ sessionId }),
      }),
  });
}

export const useRemoveNominationSessionAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (props: { fileId: string; sessionId: string }) => {
      await $api.sessions.removeSessionAttachment({
        path: { fileId: props.fileId, sessionId: props.sessionId },
      });
    },
    onSuccess: async (_data, { sessionId }) => {
      await queryClient.invalidateQueries({
        queryKey: sessionKeys.listSessionAttachments({ sessionId }),
      });
    },
  });
};

export const useListNominationSessionAttachmentsQuery = (props: { sessionId: string }) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryFn: () =>
      $api.sessions
        .listNominationSessionAttachments({
          path: { sessionId: props.sessionId },
        })
        .then(({ data = null }) => data),
    queryKey: sessionKeys.listSessionAttachments({ sessionId: props.sessionId }),
  });

export const useCreateNominationSessionAttachmentUrlMutation = () =>
  useMutation({
    mutationFn: (props: { fileId: string; sessionId: string }) =>
      $api.sessions
        .createNominationSessionAttachmentUrl({
          path: { fileId: props.fileId, sessionId: props.sessionId },
        })
        .then(({ data = null }) => data),
  });

export const useAddNominationFileAttachmentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      files: readonly File[] | FileList;
      nominationFileId: string;
      sessionId: string;
      type: UploadNominationFileAttachmentsDto['form']['type'];
    }) => {
      await $api.sessions.uploadNominationFileAttachments({
        body: {
          files: [...input.files],
          form: multipartJson({ type: input.type } satisfies UploadNominationFileAttachmentsDto['form']),
        },
        path: { nominationFileId: input.nominationFileId, sessionId: input.sessionId },
      });
    },
    onSuccess: async (_data, { nominationFileId, sessionId, type }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((item) =>
          item.id === nominationFileId
            ? { ...item, hasJurisdictionSheet: item.hasJurisdictionSheet || type === 'FICHE_DE_JURIDICTION' }
            : item,
        ),
      );
      await queryClient.invalidateQueries({
        queryKey: sessionKeys.listNominationFileAttachments({ nominationFileId, sessionId }),
      });
    },
  });
};

export const useRemoveNominationFileAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (props: { fileId: string; nominationFileId: string; sessionId: string }) => {
      await $api.sessions.removeNominationFileAttachment({
        path: { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      });
    },
    onSuccess: async (_data, { fileId, nominationFileId, sessionId }) => {
      const attachments = queryClient.getQueryData<ListedNominationFileAttachmentDto>(
        sessionKeys.listNominationFileAttachments({ nominationFileId, sessionId }),
      );

      const remaining = attachments?.items.filter((item) => item.id !== fileId);

      if (remaining) {
        queryClient.setQueriesData(
          { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
          mapCachedNominationFiles((item) =>
            item.id === nominationFileId
              ? { ...item, hasJurisdictionSheet: remaining.some((x) => x.type === 'FICHE_DE_JURIDICTION') }
              : item,
          ),
        );
      } else {
        // nothing tells what is left on that file: let the listing say it
        await queryClient.invalidateQueries({
          queryKey: sessionKeys.listSessionNominationFiles({ sessionId }),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: sessionKeys.listNominationFileAttachments({ nominationFileId, sessionId }),
      });
    },
  });
};

export const useListNominationFileAttachmentsQuery = (props: {
  nominationFileId: string;
  sessionId: string;
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryFn: () =>
      $api.sessions
        .listNominationFileAttachments({
          path: { nominationFileId: props.nominationFileId, sessionId: props.sessionId },
        })
        .then(({ data = null }) => data),
    queryKey: sessionKeys.listNominationFileAttachments({
      nominationFileId: props.nominationFileId,
      sessionId: props.sessionId,
    }),
  });

export const useCreateNominationFileAttachmentUrlMutation = () =>
  useMutation({
    mutationFn: (props: { fileId: string; nominationFileId: string; sessionId: string }) =>
      $api.sessions
        .createNominationFileAttachmentUrl({
          path: {
            fileId: props.fileId,
            nominationFileId: props.nominationFileId,
            sessionId: props.sessionId,
          },
        })
        .then(({ data = null }) => data),
  });

export const useUpdateNominationSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      data: {
        date: string;
        dueDate: string | null;
        name: string;
        observationsClosingDate: string;
        positionStartDate: string | null;
      };
      sessionId: string;
    }) => {
      await $api.sessions.updateNominationSession({
        body: input.data,
        path: { sessionId: input.sessionId },
      });
    },

    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detailSession({ sessionId }) });
      queryClient.invalidateQueries({ queryKey: officialReportKeys.all() });
    },
  });
};

export const useDetailedNominationSessionQuery = (input: { sessionId: string | undefined }) =>
  useQuery({
    enabled: !!input.sessionId,
    queryFn: () =>
      $api.sessions
        .detailsNominationSession({
          path: { sessionId: input.sessionId! },
        })
        .then(({ data = null }) => data),
    queryKey: sessionKeys.detailSession({ sessionId: input.sessionId }),
    refetchOnMount: false,
  });

export const useSessionCommentQuery = (input: { sessionId: string }) =>
  useQuery({
    queryFn: () => $api.sessions.detailSessionComment({ path: input }).then(({ data = null }) => data),
    queryKey: sessionKeys.detailSessionComment(input),
  });

export function useWriteSessionCommentMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { comment: string }) =>
      $api.sessions.writeSessionComment({ body: mutation, path: input }),

    onSuccess: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: sessionKeys.detailSessionComment(input) }),
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.all() }),
      ]),
  });
}

const GDS_SESSIONS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectGdsSessions(data: InfiniteData<ListedNominationSessionsDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteGdsNominationSessionsQuery = (options: {
  filters: GdsSessionsFilters;
  sorting: GdsSessionsSorting;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedNominationSessionsDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.sessions
        .listSessionsOfTypeGardeDesSceaux({
          query: {
            formations: options.filters.formations,
            limit: GDS_SESSIONS_PAGE_SIZE,
            page: pageParam,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
          },
        })
        .then(({ data = null }) => data),
    queryKey: sessionKeys.listGdsSessions(options),
    select: selectGdsSessions,
  });

export function useDefineNominationFileOutcomeMutation(input: {
  nominationFileId: string;
  sessionId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: { comment: string | null; outcome: NominationFileOutcomeEnum | null }) =>
      $api.sessions.defineNominationFileOutcome({
        body: { comment: props.comment, outcome: props.outcome },
        path: { nominationFileId: input.nominationFileId, sessionId: input.sessionId },
      }),
    mutationKey: ['defineNominationFileOutcomeMutation', input],
    onSuccess: (_, { comment, outcome }) =>
      Promise.allSettled([
        Promise.resolve(
          queryClient.setQueriesData(
            { queryKey: sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }) },
            mapCachedNominationFiles((item) =>
              item.id === input.nominationFileId
                ? {
                    ...item,
                    content: {
                      ...item.content,
                      outcome: outcome === null ? null : { comment, value: outcome },
                    },
                  }
                : item,
            ),
          ),
        ),
        queryClient.invalidateQueries({
          predicate: doesQueryKey.matchesAny(
            sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }),
            sessionKeys.detailSessionNominationFile(input),
            sessionKeys.countUnaffectedFiles({ sessionId: input.sessionId }),
            sessionKeys.nominationFilesStatusCounts({ sessionId: input.sessionId }),
            agendaKeys.isSessionReadyForDocGeneration(input.sessionId),
            agendaKeys.findSessionDocs(input.sessionId),
            agendaKeys.findAgendaNominationFiles({ sessionId: input.sessionId }),
            officialReportKeys.all(),
          ),
        }),
      ]),
  });
}

export function useDefineNominationFilesOutcomeMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      items: readonly { comment: string | null; nominationFileId: string }[];
      outcome: NominationFileOutcomeEnum | null;
    }): Promise<void> => {
      await $api.sessions.defineNominationFilesOutcome({
        body: { items: [...mutation.items], outcome: mutation.outcome },
        path: { sessionId: input.sessionId },
      });
    },

    onSuccess: (_, { items }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }),
          sessionKeys.countUnaffectedFiles({ sessionId: input.sessionId }),
          sessionKeys.nominationFilesStatusCounts({ sessionId: input.sessionId }),
          agendaKeys.isSessionReadyForDocGeneration(input.sessionId),
          agendaKeys.findSessionDocs(input.sessionId),
          agendaKeys.findAgendaNominationFiles({ sessionId: input.sessionId }),
          officialReportKeys.all(),
          ...items.map(({ nominationFileId }) =>
            sessionKeys.detailSessionNominationFile({ nominationFileId, sessionId: input.sessionId }),
          ),
        ),
      }),
  });
}

export const useLolfiMagistratUrlQuery = (input: { nominationFileId: string; sessionId: string }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.sessions.getLolfiMagistratUrl({ path: input });
      return data ?? null;
    },
    queryKey: sessionKeys.lolfiMagistratUrl(input),
  });

export const getListCurrentlyAffectedReportersQueryOptions = (options: { sessionId: string }) =>
  ({
    queryFn: async () => {
      const { data } = await $api.sessions.listCurrentlyAffectedReporters({
        path: { sessionId: options.sessionId },
      });
      return data ?? null;
    },
    queryKey: sessionKeys.listCurrentlyAffectedReporters(options),
  }) as const;

export const useCountUnaffectedFilesQuery = (options: { enabled?: boolean; sessionId: string }) =>
  useQuery({
    enabled: options.enabled,
    queryFn: async () => {
      const { data } = await $api.sessions.countUnaffectedNominationFiles({
        path: { sessionId: options.sessionId },
      });

      return data ?? null;
    },
    queryKey: sessionKeys.countUnaffectedFiles(options),
  });

export const useListNominationFilesAsExcelMutation = () =>
  useMutation({
    mutationFn: async (options: { sessionId: string }): Promise<void> => {
      const { data, response } = await $api.sessions.listNominationFilesAsExcel({
        parseAs: 'blob',
        path: { sessionId: options.sessionId },
      });

      saveBlob(data as Blob, fileNameFromResponse(response, 'dossiers.xlsx'));
    },
  });

export const useListMissingEvaluationsAsExcelMutation = () =>
  useMutation({
    mutationFn: async (options: { sessionId: string }): Promise<void> => {
      const { data, response } = await $api.sessions.listMissingEvaluationsAsExcel({
        parseAs: 'blob',
        path: { sessionId: options.sessionId },
      });

      saveBlob(data as Blob, fileNameFromResponse(response, 'evaluations-manquantes.xlsx'));
    },
  });

export const useNominationFilesStatusCountsQuery = (options: { sessionId: string }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.sessions.countNominationFilesByStatus({
        path: { sessionId: options.sessionId },
        priority: 'low',
      });
      return data ?? null;
    },
    queryKey: sessionKeys.nominationFilesStatusCounts(options),
  });

export const useCountUsersNewSessionsQuery = () =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.sessions.countUsersNewSessions({ priority: 'low' });
      return data ?? null;
    },
    queryKey: sessionKeys.countUsersNewSessions(),
    staleTime: 600_000, // 10 * 60 * 1_000,,
  });

export function useValidateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { sessionId: string; userId: string }) =>
      $api.sessions.validateSession({ path: { sessionId: mutation.sessionId } }),

    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.detailSession({ sessionId }),
          sessionKeys.countUsersNewSessions(),
        ),
      }),
  });
}

export function useNominationFilesAlertMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { nominationFileId: string }) =>
      $api.sessions.hideNominationFileAlert({
        path: { nominationFileId: mutation.nominationFileId, sessionId: input.sessionId },
      }),
    onSuccess: (_, { nominationFileId }) =>
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }) },
        mapCachedNominationFiles((item) =>
          item.id === nominationFileId
            ? { ...item, content: { ...item.content, isAlertHidden: true } }
            : item,
        ),
      ),
  });
}

export function useArchiveNominationSessionMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => $api.sessions.archiveSession({ path: { sessionId: input.sessionId } }),
    onSuccess: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detailSession({ sessionId: input.sessionId }),
        }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.listGdsSessions() }),
        queryClient.invalidateQueries({ queryKey: archivedSessionKeys.listArchivedGdsSessions() }),
      ]),
  });
}

export function useDeleteNominationSessionMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => $api.sessions.deleteNominationSession({ path: { sessionId: input.sessionId } }),
    onSuccess: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: sessionKeys.countUsersNewSessions() }),

        Promise.resolve(
          queryClient.removeQueries({
            predicate: doesQueryKey.matchesAny(
              sessionKeys.countUnaffectedFiles({ sessionId: input.sessionId }),
              sessionKeys.detailSession({ sessionId: input.sessionId }),
              sessionKeys.detailSessionAffectationVersion({ sessionId: input.sessionId }),
              sessionKeys.listCurrentlyAffectedReporters({ sessionId: input.sessionId }),
              sessionKeys.listSessionAttachments({ sessionId: input.sessionId }),
              sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }),
              sessionKeys.lolfiMagistratUrl({ sessionId: input.sessionId }),
              sessionKeys.nominationFilesStatusCounts({ sessionId: input.sessionId }),
            ),
          }),
        ),
      ]),
  });
}
