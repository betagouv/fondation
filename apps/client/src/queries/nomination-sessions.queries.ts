import * as $api from '@api/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AffectReportersDto,
  ImportNominationSessionFromLodamXlsxDto,
  PaginatedNominationFileAffectationItem
} from '@api/types';

import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import type { Override } from '@/types/utils.types';
import { HttpException } from '@/utils/http-exception';

export type NominationFileSortField =
  | 'nomMagistrat'
  | 'numeroDeDossier'
  | 'dateEcheance'
  | 'priority'
  | 'grade'
  | 'gradeCible';

export interface NominationFilesQueryOptions {
  sessionId: string;
  page?: number;
  limit?: number;
  sortField?: NominationFileSortField;
  sortDirection?: 'asc' | 'desc';
  priorities?: string[];
  reporterIds?: string[];
}

export interface SessionsQueryOptions {
  page?: number;
  limit?: number;
}

export const sessionKeys = {
  detailSessionAffectationVersion: (props: { sessionId: string }) =>
    ['sessions', 'detailSessionAffectationVersion', props.sessionId] as const,
  listSessionNominationFiles: (props: NominationFilesQueryOptions) =>
    ['sessions', 'listSessionNominationFiles', props] as const,
  detailSession: (props: { sessionId: string | undefined }) =>
    ['sessions', 'detailSession', props.sessionId] as const,
  listGdsSessions: (props?: SessionsQueryOptions) => ['sessions', 'listGdsSessions', props] as const,
  listSessionAttachments: (props: { sessionId: string }) =>
    ['sessions', 'listSessionAttachments', props.sessionId] as const
};

const doesQueryKey = {
  matchesAny:
    (...prefixes: readonly string[][]) =>
    ({ queryKey }: { queryKey: readonly unknown[] }) =>
      prefixes.some((prefix) => prefix.every((segment, index) => queryKey[index] === segment)),
  matchesSessionNominationFiles:
    (sessionId: string) =>
    ({ queryKey }: { queryKey: readonly unknown[] }) =>
      queryKey[0] === 'sessions' &&
      queryKey[1] === 'listSessionNominationFiles' &&
      typeof queryKey[2] === 'object' &&
      (queryKey[2] as NominationFilesQueryOptions)?.sessionId === sessionId
} as const;

export const useDetailedNominationSessionAffectationsVersionQuery = (sessionId: string) =>
  useQuery({
    queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId }),
    queryFn: () =>
      $api.sessions
        .detailNominationSessionAffectationsVersion({ path: { sessionId } })
        .then(({ data = null }) => data)
  });

export type SessionNominationFile = PaginatedNominationFileAffectationItem['items'][number];
export const useSessionNominationFilesQuery = (options: NominationFilesQueryOptions) =>
  useQuery({
    queryKey: sessionKeys.listSessionNominationFiles(options),
    queryFn: () =>
      $api.sessions
        .listNominationFiles({
          path: { sessionId: options.sessionId },
          query: {
            page: options.page,
            limit: options.limit,
            sortField: options.sortField,
            sortDirection: options.sortDirection,
            priorities: (options.priorities ?? []) as PrioriteEnum[],
            reporterIds: options.reporterIds ?? []
          }
        })
        .then(({ data = null }) => data)
  });

/** @warning there is an issue with the code generation here */
type AffectationItem = Override<AffectReportersDto['items'][number], { priority: PrioriteEnum | null }>;

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
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesSessionNominationFiles(sessionId)
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId })
      });
    }
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
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesSessionNominationFiles(sessionId)
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId })
      });
    }
  });
}

export function useAutoAffectationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { sessionId: string; nominationFileIds: readonly string[] }) =>
      $api.sessions.autoAffectation({
        path: { sessionId: mutation.sessionId },
        body: { nominationFileIds: mutation.nominationFileIds as string[] }
      }),

    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesSessionNominationFiles(sessionId)
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId })
      });
    }
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
        predicate: doesQueryKey.matchesSessionNominationFiles(sessionId)
      })
  });
}

export function useAddNominationSessionAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; file: File }) => {
      await $api.sessions.uploadSessionAttachment({
        path: { sessionId: input.sessionId },
        body: { file: input.file }
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
        formation: FormationEnum;
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

export const useListedGdsNominationSessionsQuery = (options?: SessionsQueryOptions) =>
  useQuery({
    queryKey: sessionKeys.listGdsSessions(options),
    queryFn: () =>
      $api.sessions
        .listSessionsOfTypeGardeDesSceaux({
          query: { page: options?.page, limit: options?.limit }
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

    onSuccess: () =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesSessionNominationFiles(input.sessionId)
      })
  });
}
