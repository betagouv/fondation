import * as $api from '@api/sdk';
import type { ListObservationsResponseDto, SearchMagistratsResponseDto } from '@api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type Observation = ListObservationsResponseDto['observations'][number];
export type MagistratSearchResult = SearchMagistratsResponseDto['magistrats'][number];

export const observationKeys = {
  observations: (props?: { nominationFileId: string | undefined }) => ['observations', props] as const,
  searchMagistrats: (props?: { search?: string }) => ['searchMagistrats', props] as const
};

export function useSearchMagistratsQuery(search: string) {
  return useQuery({
    enabled: search.length >= 2,
    queryKey: observationKeys.searchMagistrats({ search }),
    queryFn: async () => {
      if (search.length < 2) return { magistrats: [] as MagistratSearchResult[] };
      const { data } = await $api.observations.searchMagistrats({
        query: { search }
      });
      return data ?? { magistrats: [] as MagistratSearchResult[] };
    }
  });
}

export function useObservationsQuery(nominationFileId: string | undefined) {
  return useQuery({
    enabled: !!nominationFileId,
    queryKey: observationKeys.observations({ nominationFileId }),
    queryFn: async () => {
      if (!nominationFileId) return { observations: [] as Observation[] };
      const { data } = await $api.observations.listObservations({
        query: { nominationFileId }
      });
      return data ?? { observations: [] as Observation[] };
    }
  });
}

export function useCreateObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      nominationFileId: string;
      magistratId: string;
      dateReception: string;
      files: File[];
    }): Promise<{ id: string } | null> => {
      const { data } = await $api.observations.createObservation({
        path: { nominationFileId: mutation.nominationFileId },
        body: {
          files: mutation.files,
          magistratId: mutation.magistratId,
          dateReception: mutation.dateReception
        }
      });
      return data ?? null;
    },
    onSuccess: (_, { nominationFileId }) => {
      queryClient.invalidateQueries({ queryKey: ['observations', nominationFileId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'listSessionNominationFiles'] });
    }
  });
}

export function useDeleteObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { observationId: string; nominationFileId: string }): Promise<void> => {
      await $api.observations.deleteObservation({
        path: { observationId: mutation.observationId }
      });
    },
    onSuccess: (_, { nominationFileId }) => {
      queryClient.invalidateQueries({ queryKey: ['observations', nominationFileId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'listSessionNominationFiles'] });
    }
  });
}

export function useGetObservationFileUrlMutation() {
  return useMutation({
    mutationFn: async (params: { observationId: string; fileId: string }): Promise<string> => {
      const { data } = await $api.observations.getObservationFileUrl({
        path: { observationId: params.observationId, fileId: params.fileId }
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
      observationId: string;
      nominationFileId: string;
      dateReception: string;
      magistratId: string;
      files?: File[];
      detachFileIds?: string[];
    }): Promise<void> => {
      await $api.observations.updateObservation({
        path: { observationId: mutation.observationId },
        query: {
          magistratId: mutation.magistratId,
          dateReception: mutation.dateReception,
          detachFileIds: mutation.detachFileIds
        },
        body: {
          files: mutation.files
        }
      });
    },
    onSuccess: (_, { nominationFileId }) => {
      queryClient.invalidateQueries({ queryKey: ['observations', nominationFileId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'listSessionNominationFiles'] });
    }
  });
}
