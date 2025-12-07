import './index.css';

import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { MutationCache, Query, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link } from 'react-router-dom';

import { AppRouter } from './router/AppRouter.tsx';
import { HttpException } from './utils/api-fetch.utils';

startReactDsfr({ defaultColorScheme: 'light', Link });

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e, q) => clearQueryClient(e, q) }),
  mutationCache: new MutationCache({ onError: (e) => clearQueryClient(e) }),
  defaultOptions: {
    mutations: {
      retry: (failureCount, error) =>
        failureCount <= 2 && error instanceof HttpException && [502, 503, 503].includes(error.statusCode)
    },
    queries: {
      retry(failureCount, error) {
        if (failureCount >= 3) return false;
        if (error instanceof HttpException) return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
        return true;
      }
    }
  }
});

async function clearQueryClient(error: Error, query?: Query<unknown, unknown>): Promise<void> {
  console.error(error);
  if (error instanceof HttpException && error.statusCode === 401) {
    // queryClient.removeQueries({
    //   predicate: ({ queryKey }) => queryKey[0] !== 'introspectSession'
    // });

    if (query?.queryKey[0] != 'introspectSession') {
      await queryClient.invalidateQueries({
        stale: true,
        queryKey: ['introspectSession']
      });
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>
);

declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}
