import type { ObservationFollowupEnum } from '@/types/enums.types';
import { HttpException } from '@/utils/http-exception';
import * as $api from '@api/sdk';
import type {
  ListObservationsResponseDto,
  PaginatedNominationFiles,
  SearchMagistratsResponseDto
} from '@api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionKeys } from './nomination-sessions.queries';

export type Observation = ListObservationsResponseDto['observations'][number];
export type MagistratSearchResult = SearchMagistratsResponseDto['items'][number];

export const observationKeys = {
  observations: (props?: { sessionId: string; nominationFileId: string | undefined }) =>
    ['observations', props] as const,
  observationDetails: (props: { sessionId: string; nominationFileId: string; observationId: string }) =>
    ['observationDetails', props] as const,
  searchMagistrats: (props?: { search?: string }) => ['searchMagistrats', props] as const
};

export function useObservationDetailsQuery(props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
}) {
  return useQuery({
    enabled: !!props.sessionId && !!props.nominationFileId && !!props.observationId,
    queryKey: observationKeys.observationDetails(props),
    queryFn: async () => {
      const { data } = await $api.observations.getObservationDetails({
        path: {
          sessionId: props.sessionId,
          nominationFileId: props.nominationFileId,
          observationId: props.observationId
        }
      });

      return data;
    }
  });
}

export function useSearchMagistratsQuery(search: string) {
  return useQuery({
    enabled: search.length >= 2,
    queryKey: observationKeys.searchMagistrats({ search }),
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await $api.magistrats.searchMagistrats({
        query: { search }
      });

      return data?.items ?? [];
    }
  });
}

export function useObservationsQuery(props: { sessionId: string; nominationFileId: string | undefined }) {
  return useQuery({
    enabled: !!props.nominationFileId,
    queryKey: observationKeys.observations(props),
    queryFn: async () => {
      if (!props.nominationFileId) return { observations: [] as Observation[] };
      const { data } = await $api.observations.listObservations({
        path: { sessionId: props.sessionId, nominationFileId: props.nominationFileId }
      });
      return data ?? { observations: [] as Observation[] };
    }
  });
}

export function useCreateObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      nominationFileId: string;
      magistratId: string;
      dateReception: string;
      description: string | undefined | null;
      files: File[];
    }): Promise<{ id: string } | null> => {
      const { data } = await $api.observations
        .createObservation({
          path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
          body: {
            files: mutation.files,
            magistratId: mutation.magistratId,
            dateReception: mutation.dateReception,
            description: mutation.description
          }
        })
        .catch((err) => {
          if (err instanceof HttpException && err.statusCode === 409) {
            throw new Error(`Une autre observation de ce magistrat existe déjà`);
          }

          throw err;
        });
      return data ?? null;
    },
    onSuccess: (_, { sessionId, nominationFileId }) =>
      Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: observationKeys.observations({ sessionId, nominationFileId })
        }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) })
      ])
  });
}

export function useDeleteObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      observationId: string;
      nominationFileId: string;
    }): Promise<void> => {
      await $api.observations.deleteObservation({
        path: {
          sessionId: mutation.nominationFileId,
          nominationFileId: mutation.nominationFileId,
          observationId: mutation.observationId
        }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId }) =>
      Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: observationKeys.observations({ sessionId, nominationFileId })
        }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) })
      ])
  });
}

export function useGetObservationFileUrlMutation() {
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      nominationFileId: string;
      observationId: string;
      fileId: string;
    }): Promise<string> => {
      const { data } = await $api.observations.getObservationFileUrl({
        path: {
          sessionId: params.sessionId,
          nominationFileId: params.nominationFileId,
          observationId: params.observationId,
          fileId: params.fileId
        }
      });
      if (!data?.url) throw new Error('URL not found');
      return data.url;
    }
  });
}

export function useUpdateObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      observationId: string;
      nominationFileId: string;
      dateReception: string;
      magistratId: string;
      description: string | undefined | null;
      files?: File[];
      detachFileIds?: string[];
    }): Promise<void> => {
      await $api.observations
        .updateObservation({
          path: {
            sessionId: mutation.sessionId,
            nominationFileId: mutation.nominationFileId,
            observationId: mutation.observationId
          },
          body: {
            magistratId: mutation.magistratId,
            dateReception: mutation.dateReception,
            detachFileIds: mutation.detachFileIds,
            description: mutation.description,
            files: mutation.files
          }
        })
        .catch((err) => {
          if (err instanceof HttpException && err.statusCode === 409) {
            throw new Error(`Une autre observation de ce magistrat existe déjà`);
          }

          throw err;
        });
    },
    onSuccess: (_, { sessionId, nominationFileId, observationId }) =>
      Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: observationKeys.observationDetails({ sessionId, nominationFileId, observationId })
        }),
        queryClient.invalidateQueries({
          queryKey: observationKeys.observations({ sessionId, nominationFileId })
        }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) })
      ])
  });
}

export function useAttachObservationMemberCommentScreenshotsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      nominationFileId: string;
      observationId: string;
      files: File[];
    }): Promise<{ items: { id: string; name: string; url: string }[] }> => {
      const { data } = await $api.observations.attachMemberCommentScreenshots({
        path: {
          sessionId: params.sessionId,
          nominationFileId: params.nominationFileId,
          observationId: params.observationId
        },
        body: {
          files: params.files
        }
      });
      return data ?? { items: [] };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: observationKeys.observationDetails({
          sessionId: variables.sessionId,
          nominationFileId: variables.nominationFileId,
          observationId: variables.observationId
        })
      });
    }
  });
}

export function useWriteObservationMemberCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      nominationFileId: string;
      observationId: string;
      comment: string;
    }): Promise<void> => {
      await $api.observations.writeMemberComment({
        path: {
          sessionId: params.sessionId,
          nominationFileId: params.nominationFileId,
          observationId: params.observationId
        },
        body: {
          comment: params.comment
        }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: observationKeys.observationDetails({
          sessionId: variables.sessionId,
          nominationFileId: variables.nominationFileId,
          observationId: variables.observationId
        })
      });
    }
  });
}

export function useFollowUpOnObservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      nominationFileId: string;
      observationId: string;
      followUp: ObservationFollowupEnum | null;
      comment: string | null;
    }) => {
      const { sessionId, nominationFileId, observationId, followUp, comment } = mutation;
      const body =
        followUp === null
          ? // FIXME: issue with code generation
            { followUp: null as unknown as ObservationFollowupEnum, comment: null }
          : { followUp: followUp as ObservationFollowupEnum, comment };

      await $api.observations.followUpOnObservation({
        body,
        path: { sessionId, nominationFileId, observationId }
      });
    },
    onSuccess: (_data, { sessionId, nominationFileId, observationId, followUp, comment }) => {
      queryClient.setQueriesData(
        { queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) },
        (old: PaginatedNominationFiles | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) =>
              item.id === nominationFileId
                ? {
                    ...item,
                    observations: item.observations.map((observation) =>
                      observation.id === observationId
                        ? { ...observation, followUp, followUpComment: comment }
                        : observation
                    )
                  }
                : item
            )
          };
        }
      );

      return queryClient.invalidateQueries({
        queryKey: observationKeys.observationDetails({ sessionId, nominationFileId, observationId })
      });
    }
  });
}
