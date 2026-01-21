import * as $api from '@api/sdk';
import type {
  GetObservationDetailsResponseDto,
  ListObservationsResponseDto,
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

export type ObservationDetails = GetObservationDetailsResponseDto;

export function useObservationDetailsQuery(props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
}) {
  return useQuery({
    enabled: !!props.sessionId && !!props.nominationFileId && !!props.observationId,
    queryKey: observationKeys.observationDetails(props),
    queryFn: async (): Promise<ObservationDetails> => {
      const { data } = await $api.sessions.getObservationDetails({
        path: {
          sessionId: props.sessionId,
          nominationFileId: props.nominationFileId,
          observationId: props.observationId
        }
      });
      return data as ObservationDetails;
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
      const { data } = await $api.sessions.listObservations({
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
      files: File[];
    }): Promise<{ id: string } | null> => {
      const { data } = await $api.sessions.createObservation({
        path: { sessionId: mutation.sessionId, nominationFileId: mutation.nominationFileId },
        body: {
          files: mutation.files,
          magistratId: mutation.magistratId,
          dateReception: mutation.dateReception
        }
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
      await $api.sessions.deleteObservation({
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
      const { data } = await $api.sessions.getObservationFileUrl({
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
      files?: File[];
      detachFileIds?: string[];
    }): Promise<void> => {
      await $api.sessions.updateObservation({
        path: {
          sessionId: mutation.sessionId,
          nominationFileId: mutation.nominationFileId,
          observationId: mutation.observationId
        },
        body: {
          magistratId: mutation.magistratId,
          dateReception: mutation.dateReception,
          detachFileIds: mutation.detachFileIds,
          files: mutation.files
        }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: observationKeys.observations({ sessionId, nominationFileId })
        }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) })
      ])
  });
}

export function useAttachObservationMemberCommentFilesMutation() {
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      nominationFileId: string;
      observationId: string;
      files: File[];
    }): Promise<{ items: { id: string; name: string; url: string }[] }> => {
      const { data } = await $api.sessions.attachObservationMemberCommentFiles({
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
      await $api.sessions.writeMemberComment({
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
