import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';

import type { FormationEnum } from '@/types/enums.types';

import type { DateOnlyJson } from 'shared-models';
import { sessionKeys } from './nomination-sessions.queries';

const agendaKeys = {
  searchChairmen: (formation: FormationEnum | undefined) => ['agenda', 'searchChairmen', formation] as const,
  findAgendaNominationFiles: () => ['agenda', 'findAgendaNominationFiles'] as const,
  agendaHtml: (id: string) => ['agenda', 'agendaHtml', id] as const
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
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({ queryKey: sessionKeys.detailSession({ sessionId }) })
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
  return useMutation({
    mutationFn: (command: { agendaId: string; force?: boolean; ignoreBody?: boolean }) =>
      $api.docs
        .generateAgendaPdf({
          path: { agendaId: command.agendaId },
          query: { force: command.force },
          parseAs: 'stream'
        })
        .then(({ data }) => data)
  });
}

export const useFindAgendaNominationFilesQuery = (query: { sessionId: string }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: agendaKeys.findAgendaNominationFiles(),
    queryFn: () =>
      $api.docs
        .findAgendaNominationFiles({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data)
  });
