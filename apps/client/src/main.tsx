import './index.css';

import './instrument.ts';

import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link } from 'react-router';

import { authKeys } from '@queries/auth.queries.ts';
import { AppRouter } from './router/AppRouter.tsx';
import { HttpException } from './utils/http-exception.ts';

startReactDsfr({ defaultColorScheme: 'light', Link });

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: clearQueryClient }),
  mutationCache: new MutationCache({ onError: clearQueryClient }),
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

async function clearQueryClient(error: Error): Promise<void> {
  console.error(error);
  if (error instanceof HttpException && error.statusCode === 401) {
    queryClient.clear();
    await queryClient.invalidateQueries({ queryKey: authKeys.introspectSession() });
  }
}

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler()
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AppRouter />
      </NuqsAdapter>
    </QueryClientProvider>
  </StrictMode>
);

declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;
}
