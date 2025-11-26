import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

export function useUpdateNominationFileCommentMutation() {
  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      nominationFileId: string;
      comment: string | null;
    }) => {
      await apiFetch(`/sessions/v2/${mutation.sessionId}/files/${mutation.nominationFileId}/comment`, {
        method: 'PATCH',
        body: JSON.stringify({ comment: mutation.comment }),
        headers: { 'content-type': 'application/json' }
      });
    }
  });
}
