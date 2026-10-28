import * as Sentry from '@sentry/node';

import { loadConfig } from './modules/framework/config';
import { WITHOUT_REQUEST_DATA } from './modules/framework/observability';
import { assertIsDefined } from './utils/is-defined';

async function initInstrumentation(): Promise<void> {
  const config = await loadConfig();
  if (!config.isProduction) return;

  const dsn = assertIsDefined(
    'sentryDsn' in config ? config.sentryDsn : undefined,
    'sentry DSN in not available',
  );

  Sentry.init({
    ...WITHOUT_REQUEST_DATA,
    dsn,
    sampleRate: 1.0,
    tracesSampleRate: 0.2,
    environment: process.env.DEPLOY_ENV,
    release: [config.appName, config.appVersion].filter((x) => !!x).join('@'),
  });
}

initInstrumentation().catch((error) => {
  console.error(error);
  process.exit(1);
});
