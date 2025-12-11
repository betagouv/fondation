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

export function useListSessionsOfTypeGardeDesSceaux(input: { userId: string | undefined }) {
  return useQuery({
    enabled: !!input.userId,
    queryKey: ['listSessionsOfTypeGardeDesSceaux', input.userId],
    queryFn: async (): Promise<{ items: SessionOfTypeGardeDesSceaux[] } | null> => {
      const response = await apiFetch<RawListSessionOfTypeGardeDesSceauxResponse>(
        `/members/v1/${input.userId}/sessions/transparence/garde-des-sceaux`,
        { method: 'GET' }
      );

      if (!response) return null;

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
  observers: string[];
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

export function useDetailedGdsSession(input: { userId: string | undefined; sessionId: string | undefined }) {
  return useQuery({
    queryKey: ['memberDetailedSession', input],
    enabled: Boolean(input.sessionId && input.userId),
    queryFn: () => {
      if (!input.sessionId) return;

      return apiFetch<{ data: DetailedSession }>(
        `/members/v1/${input.userId}/sessions/transparence/garde-des-sceaux/${input.sessionId}`,
        { method: 'GET' }
      );
    }
  });
}
