import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router';

import { WITHOUT_PERSONAL_DATA } from './observability';

Sentry.init({
  ...WITHOUT_PERSONAL_DATA,
  environment: import.meta.env.VITE_DEPLOY_ENV,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tunnel: '/monitoring',
  release: [`fondation-client`, import.meta.env.VITE_TAGGED_VERSION].filter((x) => !!x?.trim()).join('@'),
  sampleRate: 0.8,
  tracesSampleRate: 0.2,
  ignoreErrors: [/UnauthorizedHttpException/],
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  sendDefaultPii: false,
});
