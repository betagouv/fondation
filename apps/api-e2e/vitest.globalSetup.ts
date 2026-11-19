// oxlint-disable no-console
import * as http from 'node:http';
import { type AddressInfo } from 'node:net';

import postgres from 'postgres';
import { type TestProject } from 'vitest/node';

import { makeLoggedInUserFixture } from './src/fixtures/auth.fixture.ts';
import { makeLolfiFixture } from './src/fixtures/lolfi.fixture.ts';
import { makeCreateSessionFixture } from './src/fixtures/session.fixture.ts';
import { TestStepsAdmin } from './src/steps.ts';
import { startApi } from './src/utils/api.ts';
import { functions, jurisdictions } from './src/utils/seed.ts';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://fondation:secret@localhost:5435/fondation_test';

async function truncate() {
  const sql = postgres(databaseUrl, { onnotice: () => {} });
  await sql`
    truncate "identity_and_access_context"."users" cascade;
    truncate "identity_and_access_context"."login_attempts";

    truncate "data_administration_context"."session" cascade;
    truncate "data_administration_context"."jurisdictions" cascade;
    truncate "data_administration_context"."function" cascade;
    truncate "data_administration_context"."grade" cascade;
    truncate "data_administration_context"."magistrat" cascade;

    truncate "nominations_context"."session" cascade;

    truncate "reports_context"."reports" cascade;
  
    truncate "files_context"."files" cascade;

    truncate "jobs"."ingestion_job" cascade;
    truncate "jobs"."lolfi_transparence_anomaly" cascade;

    truncate "docs"."agenda" cascade;

    -- truncating the users takes the help pages along, which the migration created once
    insert into "nominations_context"."help_pages" ("content", "page", "updated_at")
    values ('', 'MEMBRE', now()), ('', 'SECRETARIAT_GENERAL', now());
  `.simple();

  await sql.end();
}

function id(prefix: string) {
  return (
    prefix +
    '_' +
    Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((x) => x.toString(32))
      .join('')
  );
}

async function seed(apiUrl: string) {
  const logIn = makeLoggedInUserFixture(apiUrl);

  const admin: TestStepsAdmin = await logIn('ADMIN');
  const sessions = makeCreateSessionFixture(admin, makeLolfiFixture({ admin, baseUrl: apiUrl }));

  await sessions.createMany([
    {
      name: `${id('seed')}|PARQUET`,
      createdAt: '01/07/2026',
      candidates: [
        {
          position: {
            function: functions.PR,
            jurisdiction: jurisdictions['CA  LYON'],
          },
          targetPosition: {
            function: functions.PR,
            jurisdiction: jurisdictions['CA  AIX EN PROVENCE'],
          },
          firstName: 'user #1 first name',
          lastName: 'user #1 last name',
        },
        {
          position: {
            function: functions.PR,
            jurisdiction: jurisdictions['CA  REIMS'],
          },
          targetPosition: {
            function: functions.PR,
            jurisdiction: jurisdictions['CA  AMIENS'],
          },
          firstName: `user #2 first name`,
          lastName: 'user #2 last name',
        },
        {
          position: {
            function: functions.PR,
            jurisdiction: jurisdictions['TJ  NARBONNE'],
          },
          targetPosition: {
            function: functions.PR,
            jurisdiction: jurisdictions['TJ  GRASSE'],
          },
          firstName: `user #3 first name`,
          lastName: 'user #3 last name',
        },
        {
          position: {
            function: functions.PR,
            jurisdiction: jurisdictions['TJ  BEZIERS'],
          },
          targetPosition: {
            function: functions.PR,
            jurisdiction: jurisdictions['TJ  TOULON'],
          },
          firstName: `user #4 first name`,
          lastName: 'user #4 last name',
        },
      ],
    },
    {
      name: `${id('seed')}|SIEGE`,
      createdAt: '01/07/2026',
      candidates: [
        {
          position: {
            function: functions.P,
            jurisdiction: jurisdictions['CA  GRENOBLE'],
          },
          targetPosition: {
            function: functions.P,
            jurisdiction: jurisdictions['CA  AMIENS'],
          },
          firstName: `user #4 first name`,
          lastName: 'user #4 last name',
        },
      ],
    },
  ]);
}

async function startAlertCollector(provide: TestProject['provide']): Promise<[tchapUrl: string, teardown: () => void]> {
  const alerts: unknown[] = [];

  const collector = http.createServer((request, response) => {
    if (request.method === 'GET') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(alerts));
      return;
    }

    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      try {
        alerts.push(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        console.error(`Unreadable alert: ${Buffer.concat(chunks).toString()}`);
      }

      response.end();
    });
  });

  await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve));

  const { port } = collector.address() as AddressInfo;
  const tchapUrl = `http://127.0.0.1:${port}`;
  provide('tchapUrl', tchapUrl);

  return [tchapUrl, () => collector.close()];
}

async function startServer(
  provide: TestProject['provide'],
  tchapUrl: string,
): Promise<[apiUrl: string, teardown: () => void | Promise<void>]> {
  if (process.env.API_URL) {
    provide('apiUrl', process.env.API_URL);
    return [
      process.env.API_URL,
      () => {
        /* noop */
      },
    ];
  }

  const [apiUrl, stop] = await startApi(tchapUrl);

  provide('apiUrl', apiUrl);
  return [apiUrl, stop];
}

export default async function setup({ provide }: TestProject) {
  await truncate();
  provide('databaseUrl', databaseUrl);
  const [tchapUrl, stopCollector] = await startAlertCollector(provide);
  const [apiUrl, teardown] = await startServer(provide, tchapUrl);
  await seed(apiUrl);

  return async () => {
    await teardown();
    stopCollector();
  };
}
