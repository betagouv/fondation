/* eslint-disable react-hooks/rules-of-hooks */

import { faker } from '@faker-js/faker/locale/fr';
import { test as base, type APIRequestContext } from '@playwright/test';
import type { RegisteredUserDto, RegisterUserDto } from '../src/generated/api/types';
import { TestApp } from './pages/test-app';

export { expect } from '@playwright/test';

type UserRole = NonNullable<RegisterUserDto['role']>;
type RegisteredUser<Role extends UserRole = UserRole> = Omit<RegisterUserDto, 'role'> & {
  id: string;
  role: Role;
};

async function registerUser<const Role extends UserRole>(
  request: APIRequestContext,
  role: Role
): Promise<RegisteredUser<Role>> {
  // see apps/api/.env.e2e
  const token = 'FthDG8SXXzWD6eOzybymzXh1bHqHepZG';

  const person = {
    email: `test_email+E2E-${crypto.randomUUID()}-E2E@justice.fr`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: faker.string.alphanumeric(20),
    gender: 'FEMALE' as const
  };

  const result = await request.post('/api/auth/v2/register', {
    data: { ...person, role },
    headers: { authorization: `Bearer ${token}` },
    failOnStatusCode: true
  });

  const { id }: RegisteredUserDto = await result.json();
  return { ...person, role: (role ?? 'MEMBRE_COMMUN') as Role, id };
}

type Fixtures = {
  app: TestApp;

  userSg: RegisteredUser<'ADJOINT_SECRETAIRE_GENERAL'>;
  memberCommon: RegisteredUser<'MEMBRE_COMMUN'>;
  memberSiege: RegisteredUser<'MEMBRE_DU_SIEGE'>;
  memberParquet: RegisteredUser<'MEMBRE_DU_PARQUET'>;
};

export const test = base.extend<Fixtures>({
  app: ({ page }, use) => use(new TestApp(page)),

  userSg: async ({ request }, use) => use(await registerUser(request, 'ADJOINT_SECRETAIRE_GENERAL')),

  memberCommon: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_COMMUN')),

  memberSiege: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_DU_SIEGE')),

  memberParquet: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_DU_PARQUET'))
});
