import postgres from 'postgres';
import { test as base, inject } from 'vitest';

import { makeLoggedInUserFixture, registerUser, type RoleEnum } from './fixtures/auth.fixture.ts';
import { makeDocsFixture } from './fixtures/docs.fixture.ts';
import { makeLolfiFixture } from './fixtures/lolfi.fixture.ts';
import { makeCreateSessionFixture } from './fixtures/session.fixture.ts';
import { RegisterUserDto } from './generated/api/types.ts';
import { makeHttpClient, TestStepsAdmin, TestStepsAgent, TestStepsMember } from './steps.ts';

export const test = base
  .extend('baseUrl', { scope: 'worker' }, () => inject('apiUrl') ?? process.env.API_URL ?? 'http://localhost:3000')
  // for what the API does not serve: a stored file, a recorded anomaly, a state the API cannot reach
  // oxlint-disable-next-line no-empty-pattern -- vitest reads the dependencies of a fixture from this pattern
  .extend('sql', { scope: 'worker' }, ({}, { onCleanup }) => {
    const sql = postgres(inject('databaseUrl'), { onnotice: () => {} });
    onCleanup(() => sql.end());

    return sql;
  })
  .extend('logIn', ({ baseUrl }) => makeLoggedInUserFixture(baseUrl))
  .extend('admin', ({ logIn }): Promise<TestStepsAdmin> => logIn('ADMIN'))
  .extend('developer', ({ logIn }): Promise<TestStepsAdmin> => logIn('DEVELOPER'))
  .extend('member', async ({ logIn }): Promise<TestStepsMember> => logIn('MEMBRE_COMMUN'))
  .extend('agent', async ({ logIn }): Promise<TestStepsAgent> => logIn('ADJOINT_SECRETAIRE_GENERAL'))

  .extend('registerUser', ({ baseUrl }) => {
    const client = makeHttpClient(baseUrl);

    return <Role extends RoleEnum>(
      user: Role | (Omit<RegisterUserDto, 'role'> & { role: Role }),
    ): Promise<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }> => {
      return registerUser({ client, user });
    };
  })
  .extend('lolfi', ({ admin, baseUrl }) => makeLolfiFixture({ admin, baseUrl }))
  .extend('sessions', ({ admin, lolfi }) => makeCreateSessionFixture(admin, lolfi))
  .extend('docs', ({ admin, agent, registerUser, sessions }) =>
    makeDocsFixture({ admin, agent, registerUser, sessions }),
  );
