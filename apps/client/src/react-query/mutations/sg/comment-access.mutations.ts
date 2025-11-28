import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

export function useUpdateCommentAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; userIds: string[] }) => {
      await apiFetch(`/sessions/v2/${mutation.sessionId}/files/${mutation.nominationFileId}/comment-access`, {
        method: 'PUT',
        body: JSON.stringify({ userIds: mutation.userIds }),
        headers: { 'content-type': 'application/json' }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId }) => {
      queryClient.invalidateQueries({
        queryKey: ['commentAccess', sessionId, nominationFileId]
      });
      queryClient.invalidateQueries({
        queryKey: ['sessionNominationFiles', sessionId]
      });
    }
  });
}
