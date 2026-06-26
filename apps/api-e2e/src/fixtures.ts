import { test as base, inject } from 'vitest';

import { makeLoggedInUserFixture, registerUser } from './fixtures/auth.fixture';
import { makeCreateSessionFixture } from './fixtures/session.fixture';
import { RegisterUserDto } from './generated/api/types';
import { makeHttpClient, TestStepsAgent, TestStepsMember } from './steps';

type RoleEnum = NonNullable<RegisterUserDto['role']>;

export const test = base
  .extend(
    'baseUrl',
    { scope: 'worker' },
    () => inject('apiUrl') ?? process.env.API_URL ?? 'http://localhost:3000',
  )
  .extend('agent', async ({ baseUrl }): Promise<TestStepsAgent> => {
    const logIn = makeLoggedInUserFixture(baseUrl);
    const steps = await logIn('ADMIN');

    return steps as any;
  })
  .extend('member', async ({ baseUrl }): Promise<TestStepsMember> => {
    const logIn = makeLoggedInUserFixture(baseUrl);
    const steps = await logIn('MEMBRE_COMMUN');
    return steps as any;
  })
  .extend('registerUser', ({ baseUrl }) => {
    const client = makeHttpClient(baseUrl);

    return <Role extends RoleEnum>(
      user: Role | (Omit<RegisterUserDto, 'role'> & { role: Role }),
    ): Promise<{ id: string; firstName: string; lastName: string; email: string; password: string }> => {
      return registerUser({ client, user });
    };
  })
  .extend('withSession', async ({ agent }) => makeCreateSessionFixture(agent));

export { beforeAll, beforeEach, describe, expect, vi } from 'vitest';
export { test as it };
