// oxlint-disable no-console
import { spawn } from 'node:child_process';

import postgres from 'postgres';
import { type TestProject } from 'vitest/node';

import { makeLoggedInUserFixture } from './src/fixtures/auth.fixture';
import { makeCreateSessionFixture } from './src/fixtures/session.fixture';
import { TestStepsAdmin } from './src/steps';
import { functions, jurisdictions } from './src/utils/seed';

function makeOnData(source: 'stdout' | 'stderr', resolve: (url: string) => void) {
  const decoder = new TextDecoder();
  const re = /running on\s*(http:\/\/[[\]a-zA-Z0-9\/\-_:]+)/i;

  return function onData(chunk: Buffer) {
    const line = decoder.decode(chunk);
    const match = re.exec(line);

    // if (source === 'stdout') process.stdout.write(line);
    if (source === 'stderr') process.stderr.write(line);

    if (match) resolve(match[1]!);
  };
}

async function truncate() {
  const dbUrl = process.env.DATABASE_URL ?? 'postgres://fondation:secret@localhost:5435/fondation_test';
  const sql = postgres(dbUrl, { onnotice: () => {} });
  await sql`
    truncate "identity_and_access_context"."users" cascade;

    truncate "data_administration_context"."jurisdictions" cascade;
    truncate "data_administration_context"."function" cascade;
    truncate "data_administration_context"."grade" cascade;

    truncate "nominations_context"."magistrat" cascade;
    truncate "nominations_context"."session" cascade;

    truncate "reports_context"."reports" cascade;
  
    truncate "files_context"."files" cascade;

    truncate "jobs"."ingestion_job" cascade;

    truncate "docs"."agenda" cascade;
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
  const sessions = makeCreateSessionFixture(admin);

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
          lastName: 'user #4 last name',
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
          firstName: `user #3 first name`,
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

async function startServer(provide: TestProject['provide']): Promise<[apiUrl: string, teardown: () => void]> {
  if (process.env.API_URL) {
    provide('apiUrl', process.env.API_URL);
    return [
      process.env.API_URL,
      () => {
        /* noop */
      },
    ];
  }

  const server = spawn('pnpm', ['--filter', 'api', 'start:e2e'], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  const kill = () => {
    server.removeAllListeners();
    if (!server.pid) return;
    try {
      process.kill(-server.pid, 'SIGKILL'); // whole group
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ESRCH') throw err;
      // group already gone — fall back to the direct child if it's still around
      try {
        server.kill('SIGKILL');
      } catch {
        /* already dead */
      }
    }
  };

  const apiUrl = await new Promise<string>((resolve, reject) => {
    let alreadyResolved = false;
    const resolveAndRemoveTimeout = (value: string) => {
      alreadyResolved = true;
      resolve(value);
    };

    const signal = AbortSignal.timeout(10_000);
    signal.addEventListener('abort', () => {
      if (alreadyResolved) return;

      kill();
      reject(new Error('API server did not start within 10s'));
    });

    server.stdout?.on('data', makeOnData('stdout', resolveAndRemoveTimeout));
    server.stderr?.on('data', makeOnData('stderr', resolveAndRemoveTimeout));

    server.on('error', reject);
    server.on('exit', (code) => {
      if (code !== 0) reject(new Error(`API server exited with code ${code}`));
    });
  });

  provide('apiUrl', apiUrl);
  return [apiUrl, kill];
}

export default async function setup({ provide }: TestProject) {
  await truncate();
  const [apiUrl, teardown] = await startServer(provide);
  await seed(apiUrl);

  return teardown;
}
