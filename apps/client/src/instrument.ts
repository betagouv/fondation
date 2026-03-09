import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router';

Sentry.init({
  environment: import.meta.env.VITE_DEPLOY_ENV,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: [`fondation-client`, import.meta.env.VITE_TAGGED_VERSION].filter((x) => !!x?.trim()).join('@'),
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes
    })
  ],
  sendDefaultPii: false
});
