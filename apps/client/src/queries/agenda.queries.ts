import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';

import type { FormationEnum } from '@/types/enums.types';

import type { FoundJusticeContactsDto } from '@api/types';
import type { DateOnlyJson } from 'shared-models';

export const agendaKeys = {
  searchChairmen: (formation: FormationEnum | undefined) => ['agenda', 'searchChairmen', formation] as const,
  findAgendaNominationFiles: (query: { sessionId: string; ignoreAgendaId?: string }) =>
    ['agenda', 'findAgendaNominationFiles', query.sessionId, query.ignoreAgendaId] as const,
  agendaHtml: (id: string) => ['agenda', 'agendaHtml', id] as const,
  findSessionDocs: (sessionId: string) => ['agenda', 'findSessionDocs', sessionId] as const,
  isSessionReadyForDocGeneration: (sessionId: string) =>
    ['agenda', 'isSessionReadyForDocGeneration', sessionId] as const,
  detailsAgendaMetadata: (query: { agendaId: string | undefined | null }) =>
    ['agenda', 'detailsAgendaMetadata', query.agendaId ?? undefined] as const
};

export const useSearchChairmenQuery = (props: { formation: FormationEnum | undefined }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: agendaKeys.searchChairmen(props.formation),
    queryFn: () =>
      $api.docs.searchChairmen({ query: { formation: props.formation } }).then(({ data = null }) => data)
  });

export function useCreateAgendaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      sessionId: string;
      sessionMeetingDate: DateOnlyJson;
      date: DateOnlyJson;
      nominationFileIds: string[];
      chairmanId: string;
    }) =>
      $api.docs
        .createAgenda({
          path: { sessionId: command.sessionId },
          body: {
            nominationFileIds: command.nominationFileIds,
            date: command.date,
            sessionMeetingDate: command.sessionMeetingDate,
            chairmanId: command.chairmanId
          }
        })
        .then(({ data }) => data!),

    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findAgendaNominationFiles({ sessionId })
      });
    }
  });
}

export const useDetailsAgendaMetadataQuery = (query: { agendaId: string | undefined | null }) =>
  useQuery({
    enabled: !!query.agendaId,
    queryKey: agendaKeys.detailsAgendaMetadata(query),
    queryFn: async () => {
      if (!query.agendaId) return;

      const { data = null } = await $api.docs.detailsAgendaMetadata({ path: { agendaId: query.agendaId } });
      return data;
    }
  });

export function useUpdateAgendaMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      agendaId: string;
      sessionMeetingDate: DateOnlyJson;
      date: DateOnlyJson;
      nominationFileIds: string[];
      chairmanId: string;
    }) =>
      $api.docs
        .updateAgenda({
          path: { agendaId: command.agendaId },
          body: {
            nominationFileIds: command.nominationFileIds,
            date: command.date,
            sessionMeetingDate: command.sessionMeetingDate,
            chairmanId: command.chairmanId
          }
        })
        .then(({ data }) => data!),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findAgendaNominationFiles({ sessionId })
      });
    }
  });
}

export const useAgendaHtmlQuery = (query: { id: string | undefined; force?: boolean }) =>
  useQuery({
    enabled: !!query.id,
    queryKey: agendaKeys.agendaHtml(query.id ?? ''),
    queryFn: () =>
      $api.docs
        .generateAgendaHtml({ path: { agendaId: query.id! }, query: { force: query.force }, parseAs: 'text' })
        .then(({ data }) => (data ?? null) as string | null)
  });

export function useGenerateAgendaPdfMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: { agendaId: string; sessionId: string; force?: boolean }) =>
      $api.docs
        .generateAgendaPdf({
          path: { agendaId: command.agendaId },
          query: { force: command.force },
          parseAs: 'stream'
        })
        .then(({ response }) => response.body?.cancel()),

    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findSessionDocs(sessionId)
      })
  });
}

export const useFindAgendaNominationFilesQuery = (query: {
  sessionId: string;
  ignoreAgendaId: string | null;
}) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: agendaKeys.findAgendaNominationFiles({
      sessionId: query.sessionId,
      ignoreAgendaId: query.ignoreAgendaId ?? undefined
    }),
    queryFn: () =>
      $api.docs
        .findAgendaNominationFiles({
          path: { sessionId: query.sessionId },
          query: { ignoreAgendaId: query.ignoreAgendaId ?? undefined }
        })
        .then(({ data = null }) => data)
  });

export const useFindSessionDocsQuery = (query: { sessionId: string }) =>
  useQuery({
    queryKey: agendaKeys.findSessionDocs(query.sessionId),
    queryFn: () =>
      $api.docs
        .findSessionDocs({ path: { sessionId: query.sessionId }, priority: 'low' })
        .then(({ data = null }) => data)
  });

export const useDetailsSessionDocMutation = () =>
  useMutation({
    mutationFn: (command: { sessionId: string; agendaId: string }) =>
      $api.docs
        .detailsSessionDoc({ path: { sessionId: command.sessionId, agendaId: command.agendaId } })
        .then(({ data }) => data!)
  });

export const useIsSessionReadyForDocGenerationQuery = (query: { sessionId: string }) =>
  useQuery({
    queryKey: agendaKeys.isSessionReadyForDocGeneration(query.sessionId),
    queryFn: () =>
      $api.docs
        .isSessionReadyForDocGeneration({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data)
  });

export function useDeleteAgenda(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { agendaId: string }) =>
      $api.docs.deleteAgenda({ path: { agendaId: mutation.agendaId } }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({ queryKey: agendaKeys.isSessionReadyForDocGeneration(sessionId) });
    }
  });
}

export const officialReportKeys = {
  listAgendas: (sessionId: string) => ['officialReport', 'listAgendas', sessionId] as const,
  listMembers: (sessionId: string) => ['officialReport', 'listMembers', sessionId] as const,
  listSecretaries: () => ['officialReport', 'listSecretaries'] as const,
  findJusticeContacts: (query: { search?: string } = {}) => [
    'officialReport',
    'findJusticeContact',
    query.search ? { search: query.search } : undefined
  ]
};

export const useListAgendasForNewOfficialReportQuery = (query: { sessionId: string }) =>
  useQuery({
    queryKey: officialReportKeys.listAgendas(query.sessionId),
    queryFn: () =>
      $api.docs
        .listAgendasForNewOfficialReport({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data)
  });

export const useListMembersForNewOfficialReportQuery = (query: { sessionId: string }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.listMembers(query.sessionId),
    queryFn: () =>
      $api.docs
        .listMembersForNewOfficialReport({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data)
  });

export const useListSecretariesForNewOfficialReportQuery = (query: { sessionId: string }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.listSecretaries(),
    queryFn: () =>
      $api.docs
        .listSecretariesForNewOfficialReport({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data)
  });

export const useFindJusticeContacts = (query: { search: string | undefined }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.findJusticeContacts(query),
    queryFn: () =>
      $api.docs
        .searchOfficialReportJusticeContact({
          query: { search: query.search }
        })
        .then(({ data = null }) => data)
  });

export function useCreateJusticeContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: { name: string }) =>
      $api.docs
        .createOfficialReportJusticeContact({ body: { name: command.name } })
        .then(({ data = null }) => data),

    onSuccess(data) {
      if (!data) return;

      return queryClient.setQueryData(
        officialReportKeys.findJusticeContacts(),
        (justiceContacts: FoundJusticeContactsDto) => {
          if (!justiceContacts) return undefined;

          const { items } = justiceContacts;
          if (!items.some((item) => item.id === data.id)) {
            return { items: items.concat(data) };
          }

          return { items: items.map((item) => (item.id === data.id ? data : item)) };
        }
      );
    }
  });
}

export function useCreateOfficialReportMutation() {
  return useMutation({
    mutationFn: (command: {
      sessionId: string;
      sessionMeetingDate: { year: number; month: number; day: number };
      sessionMeetingTime: { hours: number; minutes?: number };
      hasRenunciation: boolean;
      justiceDepartmentContactId: number;
      chairmanId: string;
      secretaryId: string;
      agendas: string[];
      members: string[];
    }) =>
      $api.docs
        .createOfficialReport({
          path: { sessionId: command.sessionId },
          body: {
            sessionMeetingDate: command.sessionMeetingDate,
            sessionMeetingTime: command.sessionMeetingTime,
            hasRenunciation: command.hasRenunciation,
            justiceDepartmentContactId: command.justiceDepartmentContactId,
            chairmanId: command.chairmanId,
            secretaryId: command.secretaryId,
            agendas: command.agendas as [string, ...string[]],
            members: command.members as [string, ...string[]]
          }
        })
        .then(({ data }) => data!)
  });
}
