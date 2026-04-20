import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@api/client';
import * as $api from '@api/sdk';
import type {
  AffectReportersDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListNominationFilesAsExcelData,
  ListNominationFilesData,
  ListSessionsOfTypeGardeDesSceauxData,
  NoneAffectationVersion,
  PaginatedNominationFiles,
  SomeAffectationVersion
} from '@api/types';

import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import { HttpException } from '@/utils/http-exception';
import { getBaseUrl } from '@/utils/http.config';
import { agendaKeys } from './agenda.queries';

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
  detailSession: (props?: { sessionId: string | undefined }) =>
    key('sessions', 'detailSession', props?.sessionId),
  listGdsSessions: (props?: {
    pagination: { pageIndex: number; pageSize: number } | undefined;
    sorting:
      | []
      | [{ id: NonNullable<ListSessionsOfTypeGardeDesSceauxData['query']>['sortBy']; desc: boolean }]
      | undefined;
    filters: { formations?: FormationEnum[] } | undefined;
  }) => key('sessions', 'listGdsSessions', props),
  listSessionAttachments: (props: { sessionId: string }) =>
    key('sessions', 'listSessionAttachments', props.sessionId),
  lolfiMagistratUrl: (props?: { sessionId: string; nominationFileId: string }) =>
    key('sessions', 'lolfiMagistratUrl', props?.sessionId, props?.nominationFileId),
  listCurrentlyAffectedReporters: (props?: { sessionId: string }) =>
    key('sessions', 'listCurrentlyAffectedReporters', props?.sessionId),
  countUnaffectedFiles: (props?: { sessionId: string; nominationFileIds?: readonly string[] }) =>
    key('sessions', 'countUnaffectedFiles', props?.sessionId, props?.nominationFileIds),
  nominationFilesStatusCounts: (props?: { sessionId: string }) =>
    key('sessions', 'nominationFilesStatusCounts', props?.sessionId),
  countUsersNewSessions: () => key('sessions', 'countUsersNewSessions')
};

const doesQueryKey = {
  matchesAny:
    (...keys: (readonly unknown[])[]) =>
    ({ queryKey }: { queryKey: readonly unknown[] }) =>
      keys.some((key) =>
        key.every((x, i) =>
          typeof queryKey[i] === 'string' || typeof queryKey[i] === 'number'
            ? queryKey[i] === x
            : JSON.stringify(queryKey[i]) === JSON.stringify(x)
        )
      )
} as const;

export const useDetailedNominationSessionAffectationsVersionQuery = (sessionId: string) =>
  useQuery({
    queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId }),
    queryFn: () =>
      $api.sessions
        .detailNominationSessionAffectationsVersion({ path: { sessionId } })
        // FIXME: broken type generation with oneOf
        // https://github.com/hey-api/openapi-ts/issues/3270
        // ☝️ this is an AI responding...
        .then(({ data = null }) => data as SomeAffectationVersion | NoneAffectationVersion | null)
  });

export type SessionNominationFile = PaginatedNominationFiles['items'][number];
export const useSessionNominationFilesQuery = (options: {
  sessionId: string;
  filters:
    | {
        reporterIds?: (string | 'null')[];
        priorities?: (PrioriteEnum | 'null')[];
        outcomes?: (NominationFileOutcomeEnum | null)[];
      }
    | undefined;
  pagination: { pageIndex: number; pageSize: number } | undefined;
  sorting: [] | [{ id: NonNullable<ListNominationFilesData['query']>['sortBy']; desc: boolean }] | undefined;
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryKey: sessionKeys.listSessionNominationFiles(options),
    queryFn: () => {
      return $api.sessions
        .listNominationFiles({
          path: { sessionId: options.sessionId },
          query: {
            limit: options.pagination?.pageSize,
            page:
              (options.pagination?.pageIndex ?? 0) > 0 ? (options.pagination?.pageIndex ?? 0) + 1 : undefined,
            sortBy: options.sorting?.[0]?.id,
            sortDesc: options.sorting?.[0]?.desc ? 'true' : undefined,
            priorities: options.filters?.priorities,
            reporterIds: options.filters?.reporterIds,
            outcomes: options.filters?.outcomes?.join(',')
          }
        })
        .then(({ data = null }) => data);
    }
  });

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
        body: { items: mutation.affectations as AffectReportersDto['items'] }
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId }),
          sessionKeys.countUnaffectedFiles({ sessionId }),
          sessionKeys.nominationFilesStatusCounts({ sessionId }),
          sessionKeys.listCurrentlyAffectedReporters({ sessionId })
        )
      })
  });
}

export function usePublishVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string }): Promise<void> => {
      await $api.sessions.publishNominationSessionAffectationsVersion({
        path: { sessionId: mutation.sessionId }
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId })
        )
      })
  });
}

export function useAutoAffectationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: {
      sessionId: string;
      nominationFileIds: readonly string[] | undefined;
      excludedMemberIds: string[] | undefined;
    }) =>
      $api.sessions.autoAffectation({
        path: { sessionId: mutation.sessionId },
        body: {
          nominationFileIds: mutation.nominationFileIds as string[] | undefined,
          excludedMemberIds: mutation.excludedMemberIds
        }
      }),

    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId }),
          sessionKeys.countUnaffectedFiles({ sessionId }),
          sessionKeys.nominationFilesStatusCounts({ sessionId }),
          sessionKeys.listCurrentlyAffectedReporters({ sessionId })
        )
      })
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
            form: new Blob([JSON.stringify(form satisfies ImportNominationSessionFromLodamXlsxDto['form'])], {
              type: 'application/json'
            }) as any // eslint-disable-line
          }
        });
        return data;
      } catch (err) {
        if (err instanceof HttpException && err.statusCode === 400) {
          const { validationErrors } = await err.response.json();
          throw Object.assign(new Error(), { validationErrors });
        }

        throw err;
      }
    }
  });

export function useUpdateNominationSessionObserversFromLodamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { file: File; sessionId: string }) => {
      try {
        await $api.sessions.updateSessionObservers({
          path: { sessionId: input.sessionId },
          body: { file: input.file }
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
        queryKey: sessionKeys.listSessionNominationFiles({ sessionId })
      })
  });
}

export function useAddNominationSessionAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; files: readonly File[] | FileList }) => {
      if (input.files.length === 0) return;

      await $api.sessions.uploadSessionAttachments({
        path: { sessionId: input.sessionId },
        body: { files: [...input.files] }
      });
    },
    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionAttachments({ sessionId }) })
  });
}

export const useRemoveNominationSessionAttachmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (props: { sessionId: string; fileId: string }) => {
      await $api.sessions.removeSessionAttachment({
        path: { sessionId: props.sessionId, fileId: props.fileId }
      });
    },
    onSuccess: async (_data, { sessionId }) => {
      await queryClient.invalidateQueries({
        queryKey: sessionKeys.listSessionAttachments({ sessionId })
      });
    }
  });
};

export const useListNominationSessionAttachmentsQuery = (props: { sessionId: string }) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryKey: sessionKeys.listSessionAttachments({ sessionId: props.sessionId }),
    queryFn: () =>
      $api.sessions
        .listNominationSessionAttachments({
          path: { sessionId: props.sessionId }
        })
        .then(({ data = null }) => data)
  });

export const useCreateNominationSessionAttachmentUrlMutation = () =>
  useMutation({
    mutationFn: (props: { sessionId: string; fileId: string }) =>
      $api.sessions
        .createNominationSessionAttachmentUrl({
          path: { sessionId: props.sessionId, fileId: props.fileId }
        })
        .then(({ data = null }) => data)
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
        body: input.data
      });
    },

    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detailSession({ sessionId }) });
    }
  });
};

export const useDetailedNominationSessionQuery = (input: { sessionId: string | undefined }) =>
  useQuery({
    enabled: !!input.sessionId,
    queryKey: sessionKeys.detailSession({ sessionId: input.sessionId }),
    queryFn: () =>
      $api.sessions
        .detailsNominationSession({
          path: { sessionId: input.sessionId! }
        })
        .then(({ data = null }) => data)
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
            formations: options.filters?.formations
          }
        })
        .then(({ data = null }) => data)
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
          outcome: props.outcome as NominationFileOutcomeEnum
        }
      }),

    onSuccess: (_, { outcome, comment }) =>
      Promise.allSettled([
        queryClient.setQueriesData(
          { queryKey: sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }) },
          (old: PaginatedNominationFiles | undefined) => {
            if (!old) return old;

            return {
              ...old,
              items: old?.items.map((item) =>
                item.id === input.nominationFileId
                  ? {
                      ...item,
                      content: {
                        ...item.content,
                        outcome: outcome === null ? null : { value: outcome, comment }
                      }
                    }
                  : item
              )
            };
          }
        ),
        queryClient.invalidateQueries({
          predicate: doesQueryKey.matchesAny(
            sessionKeys.countUnaffectedFiles({ sessionId: input.sessionId }),
            sessionKeys.nominationFilesStatusCounts({ sessionId: input.sessionId }),
            agendaKeys.isSessionReadyForDocGeneration(input.sessionId)
          )
        })
      ])
  });
}

export const useLolfiMagistratUrlQuery = (input: { sessionId: string; nominationFileId: string }) =>
  useQuery({
    queryKey: sessionKeys.lolfiMagistratUrl(input),
    queryFn: async () => {
      const { data } = await $api.sessions.getLolfiMagistratUrl({ path: input });
      return data ?? null;
    }
  });

export const getListCurrentlyAffectedReportersQueryOptions = (options: { sessionId: string }) =>
  ({
    queryKey: sessionKeys.listCurrentlyAffectedReporters(options),
    queryFn: async () => {
      const { data } = await $api.sessions.listCurrentlyAffectedReporters({
        path: { sessionId: options.sessionId }
      });
      return data ?? null;
    }
  }) as const;

export const useListCurrentlyAffectedReportersQuery = (options: { sessionId: string }) =>
  useQuery(getListCurrentlyAffectedReportersQueryOptions(options));

export const useCountUnaffectedFilesQuery = (options: {
  sessionId: string;
  nominationFileIds: readonly string[] | undefined;
}) =>
  useQuery({
    queryKey: sessionKeys.countUnaffectedFiles(options),
    queryFn: async () => {
      const { data } = await $api.sessions.countUnaffectedNominationFiles({
        path: { sessionId: options.sessionId },
        query: {
          nominationFileIds:
            (options.nominationFileIds ?? [])?.length > 0 ? options.nominationFileIds?.join(',') : undefined
        }
      });

      return data ?? null;
    }
  });

export const useListNominationFilesAsExcelMutation = () =>
  useMutation({
    mutationFn: async (options: { sessionId: string }): Promise<void> => {
      const { sessionId } = options;
      const url = client.buildUrl<ListNominationFilesAsExcelData>({
        url: '/api/sessions/v2/{sessionId}/files.xlsx',
        path: { sessionId },
        baseUrl: getBaseUrl()
      });

      const $a = document.createElement('a');
      $a.href = url;
      $a.target = '_blank';
      $a.rel = 'noopener';
      $a.style.display = 'none';

      document.body.appendChild($a);
      $a.click();
      $a.remove();
    }
  });

export const useNominationFilesStatusCountsQuery = (options: { sessionId: string }) =>
  useQuery({
    queryKey: sessionKeys.nominationFilesStatusCounts(options),
    queryFn: async () => {
      const { data } = await $api.sessions.countNominationFilesByStatus({
        path: { sessionId: options.sessionId },
        priority: 'low'
      });
      return data ?? null;
    }
  });

export const useCountUsersNewSessionsQuery = () =>
  useQuery({
    staleTime: 600_000, // 10 * 60 * 1_000,
    queryKey: sessionKeys.countUsersNewSessions(),
    queryFn: async () => {
      const { data } = await $api.sessions.countUsersNewSessions({ priority: 'low' });
      return data ?? null;
    }
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
          sessionKeys.countUsersNewSessions()
        )
      })
  });
}

export function useNominationFilesAlertMutation(input: { sessionId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { nominationFileId: string }) =>
      $api.sessions.hideNominationFileAlert({
        path: { sessionId: input.sessionId, nominationFileId: mutation.nominationFileId }
      }),
    onSuccess: (_, { nominationFileId }) =>
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }) },
        (old: PaginatedNominationFiles | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) =>
              item.id === nominationFileId
                ? { ...item, content: { ...item.content, isAlertHidden: true } }
                : item
            )
          };
        }
      )
  });
}
