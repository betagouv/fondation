import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import { HttpException } from '@/utils/http-exception';
import { getBaseUrl } from '@/utils/http.config';
import { multipartJson } from '@/utils/multipart-json';
import { client } from '@api/client';
import * as $api from '@api/sdk';
import type {
  AffectReportersDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListedNominationFileAttachmentDto,
  ListMissingEvaluationsAsExcelData,
  ListNominationFilesAsExcelData,
  ListNominationFilesData,
  ListSessionsOfTypeGardeDesSceauxData,
  PaginatedNominationFiles,
  UploadNominationFileAttachmentsDto,
} from '@api/types';

import { agendaKeys } from './agenda.queries';
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

export const sessionKeys = {
  detailSessionAffectationVersion: (props?: { sessionId: string }) =>
    key('sessions', 'detailSessionAffectationVersion', props?.sessionId),
  listSessionNominationFiles: (props?: { sessionId: string; [k: string]: unknown }) => {
    const { sessionId, ...rest } = props ?? {};
    return key('sessions', 'listSessionNominationFiles', sessionId, rest);
  },
  detailSessionNominationFile: (props: {
    nominationFileId: string | undefined;
    sessionId: string | undefined;
  }) => key('sessions', 'detailSessionNominationFile', props.sessionId, props.nominationFileId),
  detailSession: (props?: { sessionId: string | undefined }) =>
    key('sessions', 'detailSession', props?.sessionId),
  listGdsSessions: (props?: {
    pagination: { pageIndex: number; pageSize: number } | undefined;
    sorting:
      | []
      | [
          {
            id: NonNullable<ListSessionsOfTypeGardeDesSceauxData['query']>['sortBy'];
            desc: boolean;
          },
        ]
      | undefined;
    filters: { formations?: FormationEnum[] } | undefined;
  }) => key('sessions', 'listGdsSessions', props),
  listSessionAttachments: (props: { sessionId: string }) =>
    key('sessions', 'listSessionAttachments', props.sessionId),
  listNominationFileAttachments: (props: { nominationFileId: string; sessionId: string }) =>
    key('sessions', 'listNominationFileAttachments', props.sessionId, props.nominationFileId),
  lolfiMagistratUrl: (props?: { sessionId: string; nominationFileId?: string }) =>
    key('sessions', 'lolfiMagistratUrl', props?.sessionId, props?.nominationFileId),
  listCurrentlyAffectedReporters: (props?: { sessionId: string }) =>
    key('sessions', 'listCurrentlyAffectedReporters', props?.sessionId),
  countUnaffectedFiles: (props?: { sessionId: string }) =>
    key('sessions', 'countUnaffectedFiles', props?.sessionId),
  nominationFilesStatusCounts: (props?: { sessionId: string }) =>
    key('sessions', 'nominationFilesStatusCounts', props?.sessionId),
  countUsersNewSessions: () => key('sessions', 'countUsersNewSessions'),
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
    queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId }),
    queryFn: () =>
      $api.sessions
        .detailNominationSessionAffectationsVersion({ path: { sessionId } })
        .then(({ data = null }) => data),
  });

export type SessionNominationFile = PaginatedNominationFiles['items'][number];
const SESSION_NOMINATION_FILES_PAGE_SIZE = 100;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectSessionNominationFiles(data: InfiniteData<PaginatedNominationFiles | null>) {
  return {
    items: data.pages.filter((page) => !!page).flatMap((page) => page.items),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteSessionNominationFilesQuery = (options: {
  sessionId: string;
  filters:
    | {
        missingEvaluation?: boolean;
        reporterIds?: string[];
        priorities?: (PrioriteEnum | 'null')[];
        outcomes?: (NominationFileOutcomeEnum | null)[];
        search?: string | null;
      }
    | undefined;
  sorting: [] | [{ id: NonNullable<ListNominationFilesData['query']>['sortBy']; desc: boolean }] | undefined;
}) =>
  useInfiniteQuery({
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    queryKey: sessionKeys.listSessionNominationFiles(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedNominationFiles | null) => lastPage?.nextPageIndex,
    queryFn: ({ pageParam }) => {
      return $api.sessions
        .listNominationFiles({
          path: { sessionId: options.sessionId },
          query: {
            limit: SESSION_NOMINATION_FILES_PAGE_SIZE,
            page: pageParam,
            missingEvaluation: options.filters?.missingEvaluation,
            sortBy: options.sorting?.[0]?.id,
            sortDesc: options.sorting?.[0]?.desc ? 'true' : undefined,
            priorities: options.filters?.priorities,
            reporterIds: options.filters?.reporterIds,
            outcomes: options.filters?.outcomes?.join(','),
            search: options.filters?.search?.trim() || undefined,
          },
        })
        .then(({ data = null }) => data);
    },
    select: selectSessionNominationFiles,
  });

export const useSessionNominationFileQuery = (options: {
  enabled: boolean;
  nominationFileId: string | undefined;
  sessionId: string | undefined;
}) =>
  useQuery({
    enabled: options.enabled && !!options.nominationFileId && !!options.sessionId,
    staleTime: 30_000,
    queryKey: sessionKeys.detailSessionNominationFile(options),
    queryFn: async () => {
      if (!options.nominationFileId || !options.sessionId) return null;

      const { data } = await $api.sessions.detailNominationFile({
        path: { nominationFileId: options.nominationFileId, sessionId: options.sessionId },
      });

      return data ?? null;
    },
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

/** @warning there is an issue with the code generation here */
type AffectationItem = AffectReportersDto['items'][number];

export function useAffectNominationFilesReportersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      affectations: readonly AffectationItem[];
    }): Promise<void> => {
      await $api.sessions.affectReporters({
        path: { sessionId: mutation.sessionId },
        body: { items: mutation.affectations as AffectReportersDto['items'] },
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
        ),
      }),
  });
}

export function useAutoAffectationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { sessionId: string; excludedMemberIds: string[] | undefined }) =>
      $api.sessions.autoAffectation({
        path: { sessionId: mutation.sessionId },
        body: { excludedMemberIds: mutation.excludedMemberIds },
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
      file: File;
      name: string;
      date: string;
      formation: FormationEnum;
      dueDate?: string | null | undefined;
      positionStartDate?: string | null | undefined;
      observationClosingDate: string;
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
          const { validationErrors } = await err.response.json();
          throw Object.assign(new Error(), { validationErrors });
        }

        throw err;
      }
    },
  });

export function useUpdateNominationSessionObserversFromLodamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { file: File; sessionId: string }) => {
      try {
        await $api.sessions.updateSessionObservers({
          path: { sessionId: input.sessionId },
          body: { file: input.file },
        });
      } catch (err) {
        if (err instanceof HttpException && err.statusCode === 400) {
          const { validationErrors } = await err.response.json();
          throw Object.assign(new Error(), { validationErrors });
        }

        throw err;
      }
    },
    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: sessionKeys.listSessionNominationFiles({ sessionId }),
      }),
  });
}

export function useAddNominationSessionAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; files: readonly File[] | FileList }) => {
      if (input.files.length === 0) return;

      await $api.sessions.uploadSessionAttachments({
        path: { sessionId: input.sessionId },
        body: { files: [...input.files] },
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
    mutationFn: async (props: { sessionId: string; fileId: string }) => {
      await $api.sessions.removeSessionAttachment({
        path: { sessionId: props.sessionId, fileId: props.fileId },
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
    queryKey: sessionKeys.listSessionAttachments({ sessionId: props.sessionId }),
    queryFn: () =>
      $api.sessions
        .listNominationSessionAttachments({
          path: { sessionId: props.sessionId },
        })
        .then(({ data = null }) => data),
  });

export const useCreateNominationSessionAttachmentUrlMutation = () =>
  useMutation({
    mutationFn: (props: { sessionId: string; fileId: string }) =>
      $api.sessions
        .createNominationSessionAttachmentUrl({
          path: { sessionId: props.sessionId, fileId: props.fileId },
        })
        .then(({ data = null }) => data),
  });

export const useAddNominationFileAttachmentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      nominationFileId: string;
      sessionId: string;
      files: readonly File[] | FileList;
      type: UploadNominationFileAttachmentsDto['form']['type'];
    }) => {
      await $api.sessions.uploadNominationFileAttachments({
        path: { nominationFileId: input.nominationFileId, sessionId: input.sessionId },
        body: {
          files: [...input.files],
          form: multipartJson({ type: input.type } satisfies UploadNominationFileAttachmentsDto['form']),
        },
      });
    },
    onSuccess: async (_data, { nominationFileId, sessionId }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((item) =>
          item.id === nominationFileId ? { ...item, hasAttachment: true } : item,
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
      const hasAttachment = (attachments?.items ?? []).some((item) => item.id !== fileId);

      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        mapCachedNominationFiles((item) =>
          item.id === nominationFileId ? { ...item, hasAttachment } : item,
        ),
      );

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
    queryKey: sessionKeys.listNominationFileAttachments({
      nominationFileId: props.nominationFileId,
      sessionId: props.sessionId,
    }),
    queryFn: () =>
      $api.sessions
        .listNominationFileAttachments({
          path: { nominationFileId: props.nominationFileId, sessionId: props.sessionId },
        })
        .then(({ data = null }) => data),
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
      sessionId: string;
      data: {
        name: string;
        date: string;
        observationsClosingDate: string;
        dueDate: string | null;
        positionStartDate: string | null;
      };
    }) => {
      await $api.sessions.updateNominationSession({
        path: { sessionId: input.sessionId },
        body: input.data,
      });
    },

    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detailSession({ sessionId }) });
    },
  });
};

export const useDetailedNominationSessionQuery = (input: { sessionId: string | undefined }) =>
  useQuery({
    refetchOnMount: false,
    enabled: !!input.sessionId,
    queryKey: sessionKeys.detailSession({ sessionId: input.sessionId }),
    queryFn: () =>
      $api.sessions
        .detailsNominationSession({
          path: { sessionId: input.sessionId! },
        })
        .then(({ data = null }) => data),
  });

export const useListedGdsNominationSessionsQuery = (options: {
  pagination: { pageIndex: number; pageSize: number } | undefined;
  sorting: [] | [{ id: 'date' | 'dueDate'; desc: boolean }] | undefined;
  filters: { formations?: FormationEnum[] } | undefined;
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryKey: sessionKeys.listGdsSessions(options),
    queryFn: () =>
      $api.sessions
        .listSessionsOfTypeGardeDesSceaux({
          query: {
            page:
              (options.pagination?.pageIndex ?? 0) > 0 ? (options.pagination?.pageIndex ?? 0) + 1 : undefined,
            limit: options.pagination?.pageSize,
            sortBy: options.sorting?.[0]?.id,
            sortDesc: options.sorting?.[0]?.desc ? 'true' : undefined,
            formations: options.filters?.formations,
          },
        })
        .then(({ data = null }) => data),
  });

export function useDefineNominationFileOutcomeMutation(input: {
  sessionId: string;
  nominationFileId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['defineNominationFileOutcomeMutation', input],
    mutationFn: (props: { outcome: NominationFileOutcomeEnum | null; comment: string | null }) =>
      $api.sessions.defineNominationFileOutcome({
        path: { sessionId: input.sessionId, nominationFileId: input.nominationFileId },
        body: {
          comment: props.comment,
          // FIXME: issue with nullable in code generation
          outcome: props.outcome as NominationFileOutcomeEnum,
        },
      }),

    onSuccess: (_, { outcome, comment }) =>
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
                      outcome: outcome === null ? null : { value: outcome, comment },
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
          ),
        }),
      ]),
  });
}

export const useLolfiMagistratUrlQuery = (input: { sessionId: string; nominationFileId: string }) =>
  useQuery({
    queryKey: sessionKeys.lolfiMagistratUrl(input),
    queryFn: async () => {
      const { data } = await $api.sessions.getLolfiMagistratUrl({ path: input });
      return data ?? null;
    },
  });

export const getListCurrentlyAffectedReportersQueryOptions = (options: { sessionId: string }) =>
  ({
    queryKey: sessionKeys.listCurrentlyAffectedReporters(options),
    queryFn: async () => {
      const { data } = await $api.sessions.listCurrentlyAffectedReporters({
        path: { sessionId: options.sessionId },
      });
      return data ?? null;
    },
  }) as const;

export const useListCurrentlyAffectedReportersQuery = (options: { sessionId: string }) =>
  useQuery(getListCurrentlyAffectedReportersQueryOptions(options));

export const useCountUnaffectedFilesQuery = (options: { enabled?: boolean; sessionId: string }) =>
  useQuery({
    enabled: options.enabled,
    queryKey: sessionKeys.countUnaffectedFiles(options),
    queryFn: async () => {
      const { data } = await $api.sessions.countUnaffectedNominationFiles({
        path: { sessionId: options.sessionId },
      });

      return data ?? null;
    },
  });

export const useListNominationFilesAsExcelMutation = () =>
  useMutation({
    mutationFn: async (options: { sessionId: string }): Promise<void> => {
      const { sessionId } = options;
      const url = client.buildUrl<ListNominationFilesAsExcelData>({
        url: '/api/sessions/v2/{sessionId}/files.xlsx',
        path: { sessionId },
        baseUrl: getBaseUrl(),
      });

      const $a = document.createElement('a');
      $a.href = url;
      $a.target = '_blank';
      $a.rel = 'noopener';
      $a.style.display = 'none';

      document.body.appendChild($a);
      $a.click();
      $a.remove();
    },
  });

export const useListMissingEvaluationsAsExcelMutation = () =>
  useMutation({
    mutationFn: async (options: { sessionId: string }): Promise<void> => {
      const url = client.buildUrl<ListMissingEvaluationsAsExcelData>({
        url: '/api/sessions/v2/{sessionId}/files/missing-evaluations.xlsx',
        path: { sessionId: options.sessionId },
        baseUrl: getBaseUrl(),
      });

      const $a = document.createElement('a');
      $a.href = url;
      $a.target = '_blank';
      $a.rel = 'noopener';
      $a.style.display = 'none';

      document.body.appendChild($a);
      $a.click();
      $a.remove();
    },
  });

export const useNominationFilesStatusCountsQuery = (options: { sessionId: string }) =>
  useQuery({
    queryKey: sessionKeys.nominationFilesStatusCounts(options),
    queryFn: async () => {
      const { data } = await $api.sessions.countNominationFilesByStatus({
        path: { sessionId: options.sessionId },
        priority: 'low',
      });
      return data ?? null;
    },
  });

export const useCountUsersNewSessionsQuery = () =>
  useQuery({
    staleTime: 600_000, // 10 * 60 * 1_000,
    queryKey: sessionKeys.countUsersNewSessions(),
    queryFn: async () => {
      const { data } = await $api.sessions.countUsersNewSessions({ priority: 'low' });
      return data ?? null;
    },
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
        path: { sessionId: input.sessionId, nominationFileId: mutation.nominationFileId },
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
