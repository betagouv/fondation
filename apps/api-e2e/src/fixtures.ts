import { test as base, inject } from 'vitest';

import { makeLoggedInUserFixture, registerUser } from './fixtures/auth.fixture.ts';
import { makeCreateSessionFixture } from './fixtures/session.fixture.ts';
import { RegisterUserDto } from './generated/api/types.ts';
import { makeHttpClient, TestStepsAdmin, TestStepsAgent, TestStepsMember } from './steps.ts';

export const test = base
  .extend(
    'baseUrl',
    { scope: 'worker' },
    () => inject('apiUrl') ?? process.env.API_URL ?? 'http://localhost:3000',
  )
  .extend('logIn', ({ baseUrl }) => makeLoggedInUserFixture(baseUrl))
  .extend('admin', ({ logIn }): Promise<TestStepsAdmin> => logIn('ADMIN'))
  .extend('member', async ({ logIn }): Promise<TestStepsMember> => logIn('MEMBRE_COMMUN'))
  .extend('agent', async ({ logIn }): Promise<TestStepsAgent> => logIn('ADJOINT_SECRETAIRE_GENERAL'))

  .extend('registerUser', ({ baseUrl }) => {
    const client = makeHttpClient(baseUrl);

    type RoleEnum = NonNullable<RegisterUserDto['role']>;
    return <Role extends RoleEnum>(
      user: Role | (Omit<RegisterUserDto, 'role'> & { role: Role }),
    ): Promise<{ id: string; firstName: string; lastName: string; email: string; password: string }> => {
      return registerUser({ client, user });
    };
  })
  .extend('sessions', ({ admin }) => makeCreateSessionFixture(admin));
