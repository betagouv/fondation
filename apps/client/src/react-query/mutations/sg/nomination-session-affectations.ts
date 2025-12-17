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
  comment?: string | null;
  commentAccessUserIds?: string[];
  content: {
    numeroDeDossier: number | null;
    nomMagistrat: string;
    dateEchéance: DateOnlyJson | null;
    grade: Magistrat.Grade;
    posteActuel: string;
    posteCible: string;
    gradeCible: string | null;
    rang: string;
    dateDeNaissance: DateOnlyJson;
    historique: string | null;
    observants: string[] | null;
    datePassageAuGrade: DateOnlyJson | null;
    datePriseDeFonctionPosteActuel: DateOnlyJson | null;
    informationCarrière: string | null;
  };
};

export type PaginatedSessionNominationFiles = {
  items: SessionNominationFile[];
  totalCount: number;
  currentPageIndex: number;
  nextPageIndex: number | undefined;
  previousPageIndex: number | undefined;
  links: { next?: string; previous?: string };
};

export type NominationFileSortField =
  | 'nomMagistrat'
  | 'numeroDeDossier'
  | 'dateEcheance'
  | 'priority'
  | 'grade'
  | 'gradeCible';

export type SessionNominationFilesQueryOptions = {
  sessionId: string;
  page?: number;
  limit?: number;
  sortField?: NominationFileSortField | null;
  sortDirection?: 'asc' | 'desc';
  priorities?: PrioriteEnum[];
  reporterIds?: string[];
};

export function useSessionNominationFilesQuery(options: SessionNominationFilesQueryOptions) {
  const { sessionId, page, limit, sortField, sortDirection, priorities, reporterIds } = options;

  return useQuery({
    queryKey: ['sessionNominationFiles', sessionId, { page, limit, sortField, sortDirection, priorities, reporterIds }],
    queryFn: () => {
      const params = new URLSearchParams();

      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      if (sortField) params.set('sortField', sortField);
      if (sortDirection) params.set('sortDirection', sortDirection);
      if (priorities?.length) {
        priorities.forEach((p) => params.append('priorities', p));
      }
      if (reporterIds?.length) {
        reporterIds.forEach((id) => params.append('reporterIds', id));
      }

      const queryString = params.toString();
      const url = `/sessions/v2/${sessionId}/files${queryString ? `?${queryString}` : ''}`;

      return apiFetch<PaginatedSessionNominationFiles>(url, { method: 'GET' });
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
