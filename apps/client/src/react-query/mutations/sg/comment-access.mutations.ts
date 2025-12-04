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
    onSuccess: (_, { sessionId, nominationFileId, userIds }) => {
      // Mise à jour optimiste du cache sans refetch
      queryClient.setQueryData(
        ['sessionNominationFiles', sessionId],
        (old: { items: Array<{ id: string; commentAccessUserIds?: string[] }> } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) =>
              file.id === nominationFileId ? { ...file, commentAccessUserIds: userIds } : file
            )
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: ['commentAccess', sessionId, nominationFileId]
      });
    }
  });
}
