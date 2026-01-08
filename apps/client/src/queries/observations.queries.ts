import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as $api from '@api/sdk';

export type MagistratSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  usedName: string;
  grade: string | null;
  professionalEmail: string | null;
};

export type Observation = {
  id: string;
  dateReception: string;
  createdAt: string;
  magistrat: {
    id: string;
    firstName: string;
    lastName: string;
    usedName: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  files: {
    id: string;
    name: string;
    signedUrl: string | null;
  }[];
};

export function useSearchMagistratsQuery(search: string) {
  return useQuery({
    queryKey: ['searchMagistrats', search],
    queryFn: async () => {
      if (search.length < 2) return { magistrats: [] as MagistratSearchResult[] };
      const { data } = await $api.observations.searchMagistrats({
        query: { search }
      });
      return data ?? { magistrats: [] };
    },
    enabled: search.length >= 2
  });
}

export function useObservationsQuery(nominationFileId: string | undefined) {
  return useQuery({
    queryKey: ['observations', nominationFileId],
    queryFn: async () => {
      if (!nominationFileId) return { observations: [] as Observation[] };
      const { data } = await $api.observations.listObservations({
        query: { nominationFileId }
      });
      return data ?? { observations: [] };
    },
    enabled: !!nominationFileId
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
        query: {
          magistratId: mutation.magistratId,
          dateReception: mutation.dateReception
        },
        body: {
          files: mutation.files as File[]
        }
      });
      return data ?? null;
    },
    onSuccess: (_, { nominationFileId }) => {
      queryClient.invalidateQueries({ queryKey: ['observations', nominationFileId] });
      queryClient.invalidateQueries({ queryKey: ['sessionNominationFiles'] });
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
      queryClient.invalidateQueries({ queryKey: ['sessionNominationFiles'] });
    }
  });
}
