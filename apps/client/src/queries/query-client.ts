import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { HttpException } from '@/utils/http-exception';

import { authKeys } from './auth.queries';
import { sessionKeys } from './nomination-sessions.queries';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: clearQueryClient }),
  mutationCache: new MutationCache({ onError: clearQueryClient, onSuccess: refreshOpenNominationFile }),
  defaultOptions: {
    mutations: { retry: false },
    queries: { retry: false },
  },
});

/** the list patches never reach this query and it is only active while an out-of-list panel is open */
function refreshOpenNominationFile(): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: sessionKeys.detailSessionNominationFile({ nominationFileId: undefined, sessionId: undefined }),
  });
}

async function clearQueryClient(error: Error): Promise<void> {
  console.error(error);
  if (error instanceof HttpException && error.statusCode === 401) {
    queryClient.clear();
    await queryClient.invalidateQueries({
      queryKey: authKeys.introspectSession(),
    });
  }
}
