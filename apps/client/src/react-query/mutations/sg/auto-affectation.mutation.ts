import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

const autoAffectation = (params: { sessionId: string; nominationFileIds: string[] }) => {
  return apiFetch(`/nominations/${params.sessionId}/auto-affectation`, {
    method: 'POST',
    body: JSON.stringify({ nominationFileIds: params.nominationFileIds }),
    headers: { 'content-type': 'application/json' }
  });
};

export const useAutoAffectationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autoAffectation,
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({
        predicate: ({ queryKey: [_0, _1] }) =>
          ['detailedNominationSessionAffectationsVersion', 'sessionNominationFiles'].includes(_0 as string) &&
          _1 === sessionId
      });
    }
  });
};
