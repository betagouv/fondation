import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

export function useUpdateNominationFileCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; comment: string | null }) => {
      await apiFetch(`/sessions/v2/${mutation.sessionId}/files/${mutation.nominationFileId}/comment`, {
        method: 'PATCH',
        body: JSON.stringify({ comment: mutation.comment }),
        headers: { 'content-type': 'application/json' }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, comment }) => {
      // Mise à jour optimiste du cache pour l'affichage de l'icône
      queryClient.setQueryData(
        ['sessionNominationFiles', sessionId],
        (old: { items: Array<{ id: string; comment?: string | null }> } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((file) =>
              file.id === nominationFileId
                ? { ...file, comment }
                : file
            )
          };
        }
      );
    }
  });
}
