import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

export function useCommentAccessQuery(sessionId: string, nominationFileId: string) {
  return useQuery({
    queryKey: ['commentAccess', sessionId, nominationFileId],
    queryFn: () =>
      apiFetch<{ userIds: string[] }>(`/sessions/v2/${sessionId}/files/${nominationFileId}/comment-access`, {
        method: 'GET'
      })
  });
}
