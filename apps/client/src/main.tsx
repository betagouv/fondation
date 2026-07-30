import './styles/index.css';
import './instrument.ts';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { Link, RouterProvider } from 'react-router';

import { queryClient } from '@queries/query-client.ts';

import { frFormat } from './i18n/formats.ts';
import { router } from './router.tsx';

startReactDsfr({ defaultColorScheme: 'light', Link });

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <IntlProvider formats={frFormat} locale="fr" defaultLocale="fr">
          <RouterProvider router={router} />
        </IntlProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  </StrictMode>,
);

if (import.meta.env.DEV) {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;
}
