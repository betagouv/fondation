import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

const publierAffectations = (sessionId: string) => {
  return apiFetch(`/nominations/dossier-de-nominations/affectations-rapporteurs/${sessionId}/publier`, {
    method: 'POST'
  });
};

export const usePublierAffectations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publierAffectations,
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: ['dossiers-de-nomination-par-session', sessionId]
      });
    }
  });
};
