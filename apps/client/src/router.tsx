import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router';

import { routes } from './routes';

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);
export const router = sentryCreateBrowserRouter(routes);
