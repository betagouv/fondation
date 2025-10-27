import { Magistrat, NominationFile, TypeDeSaisine, type DateOnlyJson } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';
import { useQuery } from '@tanstack/react-query';

// TODO: Replace by openapi generation
export type SessionOfTypeGardeDesSceaux = {
  id: string;
  label: string;
  isAffected: boolean;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  createdAt: Date;
};

type RawListSessionOfTypeGardeDesSceauxResponse = {
  items: (Omit<SessionOfTypeGardeDesSceaux, 'createdAt'> & { createdAt: string })[];
};

export function useListSessionsOfTypeGardeDesSceaux() {
  return useQuery({
    queryKey: ['listSessionsOfTypeGardeDesSceaux'],
    queryFn: async () => {
      const response = await apiFetch<RawListSessionOfTypeGardeDesSceauxResponse>(
        `/sessions/v2/garde-des-sceaux`,
        { method: 'GET' }
      );

      if (!response) return response;

      return {
        items: response.items.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }))
      };
    }
  });
}

// TODO: Replace by openapi generation
export type DetailedSessionReport = {
  id: string;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  folderNumber: number | null;
  dueDate: DateOnlyJson | null;
  name: string;
  grade: Magistrat.Grade;
  targettedPosition: string;
  observersCount: number;
};
export type DetailedSession = {
  session: {
    id: string;
    sessionImportId: string;
    formation: Magistrat.Formation;
    transparency: string;
    dateTransparence: DateOnlyJson;
  };
  reports: DetailedSessionReport[];
};
export function useDetailedGdsSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['detailedSession', sessionId],
    enabled: !!sessionId,
    queryFn: () =>
      apiFetch<{ data: DetailedSession }>(`/sessions/v2/garde-des-sceaux/${sessionId}`, { method: 'GET' })
  });
}
