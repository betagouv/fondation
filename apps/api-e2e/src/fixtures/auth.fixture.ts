// oxlint-disable no-console
import * as assert from 'node:assert/strict';

import { faker } from '@faker-js/faker';

import { Client } from '../generated/api/client/index.ts';
import { RegisteredUserDto, type RegisterUserDto } from '../generated/api/types.ts';
import { makeStepsFixtures, TestSteps } from '../steps.ts';
import { registrationToken } from '../utils/e2e-tokens.ts';

/** ADMIN stands for a member of the general secretariat who holds the admin right, TEAM_MEMBER for a technical account of the Fondation team */
export type RoleEnum = NonNullable<RegisterUserDto['role']> | 'ADMIN' | 'TEAM_MEMBER';

export type AuthUser = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
};

export function strongPassword(): string {
  return `Aa1-${crypto.randomUUID()}`;
}

export async function registerUser<Role extends RoleEnum>(options: {
  client: Client;
  user: Role | (Partial<Omit<RegisterUserDto, 'role'>> & { role: Role });
}): Promise<AuthUser> {
  const inputUser = (typeof options.user === 'string' ? { role: options.user } : options.user) as Partial<
    Omit<RegisterUserDto, 'role'>
  > & { role: RoleEnum };
  const isTechnical = inputUser.role === 'TEAM_MEMBER';
  const isAdmin = isTechnical || inputUser.role === 'ADMIN';
  const user = {
    // faker emails collide over a whole run, while the address must be unique
    email: inputUser.email ?? faker.internet.email().replace('@', `+${crypto.randomUUID()}@`),
    firstName: inputUser.firstName ?? faker.person.firstName(),
    gender: inputUser.gender ?? faker.helpers.arrayElement(['MALE', 'FEMALE']),
    isAdmin,
    isTechnical,
    lastName: inputUser.lastName ?? faker.person.lastName(),
    password: inputUser.password ?? strongPassword(),
    role: isAdmin ? 'ADJOINT_SECRETAIRE_GENERAL' : (inputUser.role as Exclude<RoleEnum, 'ADMIN' | 'TEAM_MEMBER'>),
  } satisfies RegisterUserDto;

  const client = options.client;
  const { response: userResponse, data: createdUser } = await client.post({
    body: user,
    headers: {
      Authorization: `Bearer ${registrationToken}`,
      'Content-Type': 'application/json',
    },
    throwOnError: true,
    url: `/api/auth/v2/register`,
  });
  assert.ok(userResponse.status === 201, `Registering ${user.email} failed`);

  return { ...user, id: (createdUser as RegisteredUserDto).id };
}

async function registerAndLogIn(
  steps: TestSteps,
  input: RoleEnum | (Omit<RegisterUserDto, 'role'> & { role: RoleEnum }),
): Promise<{ cookies: string[]; user: AuthUser }> {
  const user = await registerUser({ client: steps['@client'], user: input });

  const { response } = await steps.auth.login({
    body: { email: user.email, password: user.password },
    throwOnError: true,
  });
  assert.ok(response.status === 204, `Could not login as ${user.email}`);

  return { cookies: response.headers.getSetCookie(), user };
}

export function makeLoggedInUserFixture(baseUrl: string) {
  const steps = makeStepsFixtures({ baseUrl });

  return async function loggedInUserFixture(
    input: RoleEnum | (Omit<RegisterUserDto, 'role'> & { role: RoleEnum }),
  ): Promise<TestSteps> {
    const { cookies, user } = await registerAndLogIn(steps, input);

    return makeStepsFixtures({ baseUrl, cookies, user });
  };
}

export function makeImpersonationFixture(baseUrl: string) {
  const steps = makeStepsFixtures({ baseUrl });

  return async function impersonationFixture(user: { id: string }): Promise<TestSteps> {
    const { cookies } = await registerAndLogIn(steps, 'ADMIN');
    const { data } = await makeStepsFixtures({ baseUrl, cookies }).auth.impersonate({
      path: { userId: user.id },
      throwOnError: true,
    });

    return makeStepsFixtures({ baseUrl, cookies, impersonationId: data.id, user });
  };
}
