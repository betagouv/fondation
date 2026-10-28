import * as Sentry from '@sentry/node';

import { loadConfig } from './modules/framework/config';
import { WITHOUT_REQUEST_DATA } from './modules/framework/observability';
import { assertIsDefined } from './utils/is-defined';

// Stays synchronous: Sentry only instruments the modules (express, pg, http) required after its init
const config = loadConfig();
if (config.isProduction) {
  Sentry.init({
    ...WITHOUT_REQUEST_DATA,
    dsn: assertIsDefined('sentryDsn' in config ? config.sentryDsn : undefined, 'sentry DSN in not available'),
    sampleRate: 1.0,
    tracesSampleRate: 0.2,
    environment: process.env.DEPLOY_ENV,
    release: [config.appName, config.appVersion].filter((x) => !!x).join('@'),
  });
}
