// oxlint-disable no-console
import * as assert from 'node:assert/strict';

import { faker } from '@faker-js/faker';

import { Client } from '../generated/api/client/index.ts';
import { RegisteredUserDto, type RegisterUserDto } from '../generated/api/types.ts';
import { makeStepsFixtures, TestSteps } from '../steps.ts';

export type RoleEnum = NonNullable<RegisterUserDto['role']>;

export type AuthUser = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
};

export async function registerUser<Role extends RoleEnum>(options: {
  client: Client;
  user: Role | (Partial<Omit<RegisterUserDto, 'role'>> & { role: Role });
}): Promise<AuthUser> {
  const inputUser = (
    typeof options.user === 'string' ? { role: options.user } : options.user
  ) as Partial<RegisterUserDto>;
  const user = {
    role: inputUser.role as Role,
    email: inputUser.email ?? faker.internet.email(),
    firstName: inputUser.firstName ?? faker.person.firstName(),
    lastName: inputUser.lastName ?? faker.person.lastName(),
    gender: inputUser.gender ?? faker.helpers.arrayElement(['MALE', 'FEMALE']),
    password: inputUser.password ?? crypto.randomUUID(),
  } satisfies RegisterUserDto;

  const client = options.client;
  const { response: userResponse, data: createdUser } = await client.post({
    url: `/api/auth/v2/register`,
    body: user,
    throwOnError: true,
    headers: {
      'Content-Type': 'application/json',
      // see apps/api/.env.e2e#E2E_API_TOKEN
      Authorization: `Bearer FthDG8SXXzWD6eOzybymzXh1bHqHepZG`,
    },
  });
  assert.ok(userResponse.status === 201, `Registering ${user.email} failed`);

  return { ...user, id: (createdUser as RegisteredUserDto).id };
}

export function makeLoggedInUserFixture(baseUrl: string) {
  const steps = makeStepsFixtures({ baseUrl });

  return async function loggedInUserFixture(
    input: RoleEnum | (Omit<RegisterUserDto, 'role'> & { role: RoleEnum }),
  ): Promise<TestSteps> {
    const user = await registerUser({ client: steps['@client'], user: input });

    const { response } = await steps.auth.login({
      body: { email: user.email, password: user.password },
      throwOnError: true,
    });
    assert.ok(response.status === 204, `Could not login as ${user.email}`);
    const cookies = response.headers.getSetCookie();

    const config = steps['@client'].getConfig();

    return makeStepsFixtures({
      user,
      cookies,
      baseUrl: config.baseUrl,
    });
  };
}
