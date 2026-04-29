/* eslint-disable react-hooks/rules-of-hooks */

import { test as base } from '@playwright/test';
import type { RegisterUserDto } from '../src/generated/api/types';
import { ApiHttpClient } from './fixtures/api.fixture';
import { type RegisteredUser, type UserRole } from './fixtures/auth.fixture';
import { TestApp } from './pages/test-app';

export { expect } from '@playwright/test';

type Fixtures = {
  // same as anonymousApp, but the login phase is already done with the userSg
  app: TestApp;
  anonymousApp: TestApp;

  userSg: RegisteredUser<'ADJOINT_SECRETAIRE_GENERAL'>;
  memberCommon: RegisteredUser<'MEMBRE_COMMUN'>;
  memberSiege: RegisteredUser<'MEMBRE_DU_SIEGE'>;
  memberParquet: RegisteredUser<'MEMBRE_DU_PARQUET'>;

  http: ApiHttpClient;

  registerUser: <Role extends UserRole = 'MEMBRE_COMMUN'>(
    dto?: Partial<RegisterUserDto>
  ) => Promise<RegisteredUser<Role>>;
};

export const test = base.extend<Fixtures>({
  anonymousApp: ({ page }, use) => use(new TestApp(page)),

  app: async ({ anonymousApp: app, userSg }, use) => {
    await app.pages.login.goto();
    await app.pages.login.with({ email: userSg.email, password: userSg.password });

    return use(app);
  },

  http: ({ request }, use) => use(new ApiHttpClient(request)),

  registerUser: async ({ http }, use) =>
    use(
      (dto?: Partial<RegisterUserDto>) =>
        http.auth.registerUser({
          defaultUser: dto,
          role: dto?.role ?? 'MEMBRE_COMMUN'
        }) as any // eslint-disable-line
    ),

  userSg: async ({ registerUser }, use) => use(await registerUser({ role: 'ADJOINT_SECRETAIRE_GENERAL' })),

  memberCommon: async ({ registerUser }, use) => use(await registerUser({ role: 'MEMBRE_COMMUN' })),

  memberSiege: async ({ registerUser }, use) => use(await registerUser({ role: 'MEMBRE_DU_SIEGE' })),

  memberParquet: async ({ registerUser }, use) => use(await registerUser({ role: 'MEMBRE_DU_PARQUET' }))
});
