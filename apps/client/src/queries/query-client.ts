import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { HttpException } from '@/utils/http-exception';

import { authKeys } from './auth.queries';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: clearQueryClient }),
  mutationCache: new MutationCache({ onError: clearQueryClient }),
  defaultOptions: {
    mutations: { retry: false },
    queries: { retry: false },
  },
});

async function clearQueryClient(error: Error): Promise<void> {
  console.error(error);
  if (error instanceof HttpException && error.statusCode === 401) {
    queryClient.clear();
    await queryClient.invalidateQueries({
      queryKey: authKeys.introspectSession(),
    });
  }
}
