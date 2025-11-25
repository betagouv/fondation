import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';
import type { DateOnlyJson, Magistrat, PrioriteEnum } from 'shared-models';

export function useDetailedNominationSessionAffectationsVersionQuery(sessionId: string) {
  return useQuery({
    queryKey: ['detailedNominationSessionAffectationsVersion', sessionId],
    queryFn: () => {
      return apiFetch<{
        id: string;
        status: 'BROUILLON' | 'PUBLIE';
        version: number;
        publicationDate: string;
        author: { firstName: string; lastName: string } | null;
      }>(`/sessions/v2/${sessionId}/files/reporters/versions/last`, { method: 'GET' });
    }
  });
}

export type SessionNominationFile = {
  id: string;
  priority: PrioriteEnum | null;
  reporters: { id: string; firstName: string; lastName: string }[];
  comment: string | null;
  content: {
    numeroDeDossier: number | null;
    nomMagistrat: string;
    dateEchéance: DateOnlyJson | null;
    grade: Magistrat.Grade;
    posteActuel: string;
    posteCible: string;
    rang: string;
    dateDeNaissance: DateOnlyJson;
    historique: string | null;
    observants: string[] | null;
    datePassageAuGrade: DateOnlyJson | null;
    datePriseDeFonctionPosteActuel: DateOnlyJson | null;
    informationCarrière: string | null;
  };
};

export function useSessionNominationFilesQuery(options: { sessionId: string }) {
  return useQuery({
    queryKey: ['sessionNominationFiles', options.sessionId],
    queryFn: () => {
      return apiFetch<{
        items: SessionNominationFile[];
      }>(`/sessions/v2/${options.sessionId}/files`, { method: 'GET' });
    }
  });
}

export function useAffectNominationFilesReportersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      affectations: readonly {
        nominationFileId: string;
        reporterIds: readonly string[];
        priority: PrioriteEnum | null;
      }[];
    }): Promise<void> => {
      await apiFetch(`/sessions/v2/${mutation.sessionId}/files/reporters`, {
        method: 'POST',
        body: JSON.stringify({ items: mutation.affectations }),
        headers: { 'content-type': 'application/json' }
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          (queryKey[0] === 'sessionNominationFiles' && queryKey[1] === sessionId) ||
          (queryKey[0] === 'detailedNominationSessionAffectationsVersion' && queryKey[1] === sessionId)
      })
  });
}

export function usePublishVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string }): Promise<void> => {
      await apiFetch<void>(`/sessions/v2/${mutation.sessionId}/files/reporters/versions`, {
        method: 'POST'
      });
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          (queryKey[0] === 'sessionNominationFiles' && queryKey[1] === sessionId) ||
          (queryKey[0] === 'detailedNominationSessionAffectationsVersion' && queryKey[1] === sessionId)
      })
  });
}

export function useAutoAffectationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { sessionId: string; nominationFileIds: readonly string[] }) =>
      apiFetch(`/sessions/v2/${mutation.sessionId}/auto-affectation`, {
        method: 'POST',
        body: JSON.stringify({ nominationFileIds: mutation.nominationFileIds }),
        headers: { 'content-type': 'application/json' }
      }),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          (queryKey[0] === 'sessionNominationFiles' && queryKey[1] === sessionId) ||
          (queryKey[0] === 'detailedNominationSessionAffectationsVersion' && queryKey[1] === sessionId)
      });
    }
  });
}
