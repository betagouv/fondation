import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';

import type { FormationEnum } from '@/types/enums.types';

import type { DateOnlyJson } from 'shared-models';

export const agendaKeys = {
  searchChairmen: (formation: FormationEnum | undefined) => ['agenda', 'searchChairmen', formation] as const,
  findAgendaNominationFiles: (sessionId: string) =>
    ['agenda', 'findAgendaNominationFiles', sessionId] as const,
  agendaHtml: (id: string) => ['agenda', 'agendaHtml', id] as const,
  findSessionDocs: (sessionId: string) => ['agenda', 'findSessionDocs', sessionId] as const,
  isSessionReadyForDocGeneration: (sessionId: string) =>
    ['agenda', 'isSessionReadyForDocGeneration', sessionId] as const
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
      return queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          [agendaKeys.findSessionDocs(sessionId), agendaKeys.findAgendaNominationFiles(sessionId)].some(
            (parts) => queryKey.length === parts.length && queryKey.every((x, i) => parts[i] === x)
          )
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

export const useFindAgendaNominationFilesQuery = (query: { sessionId: string }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: agendaKeys.findAgendaNominationFiles(query.sessionId),
    queryFn: () =>
      $api.docs
        .findAgendaNominationFiles({ path: { sessionId: query.sessionId } })
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
