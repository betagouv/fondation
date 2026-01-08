import * as $api from '@api/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AffectReportersDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListedNominationFileAffectationItem
} from '@api/types';

import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import type { Override } from '@/types/utils.types';
import { HttpException } from '@/utils/http-exception';

export const sessionKeys = {
  detailSessionAffectationVersion: (props: { sessionId: string }) =>
    ['sessions', 'detailSessionAffectationVersion', props.sessionId] as const,
  listSessionNominationFiles: (props: { sessionId: string }) =>
    ['sessions', 'listSessionNominationFiles', props.sessionId] as const,
  detailSession: (props: { sessionId: string | undefined }) =>
    ['sessions', 'detailSession', props.sessionId] as const,
  listGdsSessions: () => ['sessions', 'listGdsSessions'] as const,
  listSessionAttachments: (props: { sessionId: string }) =>
    ['sessions', 'listSessionAttachments', props.sessionId] as const
};

type NominationSessionQueryKey = ReturnType<(typeof sessionKeys)[keyof typeof sessionKeys]>;

const doesQueryKey = {
  matchesAny:
    (...keys: readonly NominationSessionQueryKey[]) =>
    ({ queryKey }: { queryKey: readonly unknown[] }) =>
      keys.some((key) => queryKey.length === key.length && queryKey.every((x, index) => x === key[index]))
} as const;

export const useDetailedNominationSessionAffectationsVersionQuery = (sessionId: string) =>
  useQuery({
    queryKey: sessionKeys.detailSessionAffectationVersion({ sessionId }),
    queryFn: () =>
      $api.sessions
        .detailNominationSessionAffectationsVersion({ path: { sessionId } })
        .then(({ data = null }) => data)
  });

export type SessionNominationFile = ListedNominationFileAffectationItem['items'][number];
export const useSessionNominationFilesQuery = (options: { sessionId: string }) =>
  useQuery({
    queryKey: sessionKeys.listSessionNominationFiles({ sessionId: options.sessionId }),
    queryFn: () =>
      $api.sessions
        .listNominationFiles({
          path: { sessionId: options.sessionId }
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
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId })
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
    mutationFn: (mutation: { sessionId: string; nominationFileIds: readonly string[] }) =>
      $api.sessions.autoAffectation({
        path: { sessionId: mutation.sessionId },
        body: { nominationFileIds: mutation.nominationFileIds as string[] }
      }),

    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: doesQueryKey.matchesAny(
          sessionKeys.listSessionNominationFiles({ sessionId }),
          sessionKeys.detailSessionAffectationVersion({ sessionId })
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

export const useListedGdsNominationSessionsQuery = () =>
  useQuery({
    queryKey: sessionKeys.listGdsSessions(),
    queryFn: () => $api.sessions.listSessionsOfTypeGardeDesSceaux().then(({ data = null }) => data)
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
      queryClient.setQueryData(
        sessionKeys.listSessionNominationFiles({ sessionId: input.sessionId }),
        (old: ListedNominationFileAffectationItem | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old?.items.map((item) =>
              item.id === input.nominationFileId
                ? {
                    ...item,
                    content: {
                      ...item.content,
                      outcome: { value: outcome, comment }
                    }
                  }
                : item
            )
          };
        }
      )
  });
}
