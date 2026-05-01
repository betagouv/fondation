/* eslint-disable react-hooks/rules-of-hooks */

import { test as base } from '@playwright/test';
import type { RegisterUserDto } from '../src/generated/api/types';
import { ApiHttpClient } from './fixtures/api.fixture';
import { type RegisteredUser, type UserRole } from './fixtures/auth.fixture';
import { TestAnonymousApp } from './pages/test-anonymous-app';
import { TestApp } from './pages/test-app';
import { TestMemberApp } from './pages/test-member-app';

export { expect } from '@playwright/test';

type Fixtures = {
  app: TestApp;
  anonymousApp: TestAnonymousApp;

  newMemberApp: <Role extends UserRole>(
    dto: Partial<RegisterUserDto> & { role: Role }
  ) => Promise<TestMemberApp<Role>>;

  userSg: RegisteredUser<'ADJOINT_SECRETAIRE_GENERAL'>;

  http: ApiHttpClient;

  registerUser: <Role extends UserRole = 'MEMBRE_COMMUN'>(
    dto?: Partial<RegisterUserDto>
  ) => Promise<RegisteredUser<Role>>;
};

export const test = base.extend<Fixtures>({
  anonymousApp: ({ page }, use) => use(new TestAnonymousApp(page)),

  app: async ({ page, anonymousApp: app, userSg }, use) => {
    await app.pages.login.goto();
    await app.pages.login.with({ email: userSg.email, password: userSg.password });

    return use(new TestApp(page));
  },

  http: async ({ playwright }, use) => {
    // see apps/api/.env.e2e
    const token = 'FthDG8SXXzWD6eOzybymzXh1bHqHepZG';

    const http = await playwright.request.newContext({
      failOnStatusCode: true,
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: { authorization: `Bearer ${token}` }
    });

    return use(new ApiHttpClient(http));
  },

  registerUser: async ({ http }, use) =>
    use(
      (dto?: Partial<RegisterUserDto>) =>
        http.auth.registerUser({
          defaultUser: dto,
          role: dto?.role ?? 'MEMBRE_COMMUN'
        }) as any // eslint-disable-line
    ),

  userSg: async ({ registerUser }, use) => use(await registerUser({ role: 'ADJOINT_SECRETAIRE_GENERAL' })),

  newMemberApp: async ({ browser, registerUser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const app = new TestAnonymousApp(page);

    return use(
      async <Role extends UserRole>(dto: Partial<Omit<RegisterUserDto, 'role'>> & { role: Role }) => {
        const user = await registerUser<Role>(dto);
        await app.pages.login.goto();
        await app.pages.login.with({ email: user.email, password: user.password });

        const memberApp = new TestMemberApp<Role>(page, user);
        await memberApp.pages.home.goto();

        return memberApp;
      }
    );
  }
});
