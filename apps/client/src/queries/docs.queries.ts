import type { FormationEnum } from '@/types/enums.types';
import * as $api from '@api/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DateOnlyJson } from 'shared-models';
import { sessionKeys } from './nomination-sessions.queries';

const agendaKeys = {
  listChairmen: (formation: FormationEnum) => ['agenda', 'listChairmen', formation]
};

export const useListChairmenQuery = (props: { formation: FormationEnum }) =>
  useQuery({
    queryKey: agendaKeys.listChairmen(props.formation),
    queryFn: () =>
      $api.docs.searchChairmen({ query: { formation: props.formation } }).then(({ data = null }) => data)
  });

export function useCreateAgendaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      sessionId: string;
      body: {
        sessionMeetingDate: DateOnlyJson;
        date: DateOnlyJson;
        chairmanId: string;
        nominationFileIds: string[];
      };
    }) =>
      $api.docs
        .createAgenda({ path: { sessionId: command.sessionId }, body: command.body })
        .then(({ data }) => data!),
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({ queryKey: sessionKeys.detailSession({ sessionId }) })
  });
}
