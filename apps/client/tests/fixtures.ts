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
  role: Role,
  defaultUser?: Partial<Omit<RegisterUserDto, 'role'>>
): Promise<RegisteredUser<Role>> {
  // see apps/api/.env.e2e
  const token = 'FthDG8SXXzWD6eOzybymzXh1bHqHepZG';

  const person = {
    email: (defaultUser?.email || `test_email+e2e-${crypto.randomUUID()}-e2e@justice.fr`).toLowerCase(),
    firstName: (defaultUser?.firstName || faker.person.firstName()).toLowerCase(),
    lastName: (defaultUser?.lastName || faker.person.lastName()).toLowerCase(),
    password: defaultUser?.password || faker.string.alphanumeric(20),
    gender: defaultUser?.gender ?? ('FEMALE' as const)
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
  // same as anonymousApp, but the login phase is already done with the userSg
  app: TestApp;
  anonymousApp: TestApp;

  userSg: RegisteredUser<'ADJOINT_SECRETAIRE_GENERAL'>;
  memberCommon: RegisteredUser<'MEMBRE_COMMUN'>;
  memberSiege: RegisteredUser<'MEMBRE_DU_SIEGE'>;
  memberParquet: RegisteredUser<'MEMBRE_DU_PARQUET'>;

  registerUser: (dto?: Partial<RegisterUserDto>) => Promise<RegisteredUser<UserRole>>;
};

export const test = base.extend<Fixtures>({
  anonymousApp: ({ page }, use) => use(new TestApp(page)),

  app: async ({ anonymousApp: app, userSg }, use) => {
    await app.pages.login.goto();
    await app.pages.login.with({ email: userSg.email, password: userSg.password });

    return use(app);
  },

  registerUser: async ({ request }, use) =>
    use((dto?: Partial<RegisterUserDto>) => registerUser(request, dto?.role ?? 'MEMBRE_COMMUN', dto)),

  userSg: async ({ request }, use) => use(await registerUser(request, 'ADJOINT_SECRETAIRE_GENERAL')),

  memberCommon: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_COMMUN')),

  memberSiege: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_DU_SIEGE')),

  memberParquet: async ({ request }, use) => use(await registerUser(request, 'MEMBRE_DU_PARQUET'))
});
