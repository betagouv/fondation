/* oxlint-disable react-hooks/rules-of-hooks */

import { test as base } from '@playwright/test';

import type { RegisterUserDto } from '../src/generated/api/types';

import { ApiHttpClient } from './fixtures/api.fixture';
import { type RegisteredUser, type UserRole } from './fixtures/auth.fixture';
import { TestAnonymousApp } from './pages/test-anonymous-app';
import { TestApp } from './pages/test-app';
import { TestMemberApp } from './pages/test-member-app';

export { expect } from '@playwright/test';

type Fixtures = {
  http: ApiHttpClient;

  app: TestApp;
  anonymousApp: TestAnonymousApp;

  newMemberApp: <Role extends UserRole>(
    dto: Partial<RegisterUserDto> & { role: Role },
  ) => Promise<TestMemberApp<Role>>;

  registerUser: <Role extends UserRole = 'MEMBRE_COMMUN'>(
    dto?: Partial<RegisterUserDto>,
  ) => Promise<RegisteredUser<Role>>;
};

export const test = base.extend<Fixtures>({
  anonymousApp: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();

    use(new TestAnonymousApp(page));
  },

  app: async ({ page, baseURL }, use) => {
    if (!baseURL || !page.url().startsWith(baseURL)) {
      await page.goto('/');
    }

    use(new TestApp(page));
  },

  http: async ({ playwright }, use) => {
    // see apps/api/.env.e2e
    const token = 'FthDG8SXXzWD6eOzybymzXh1bHqHepZG';

    const http = await playwright.request.newContext({
      failOnStatusCode: true,
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: { authorization: `Bearer ${token}` },
    });

    return use(new ApiHttpClient(http));
  },

  registerUser: async ({ http }, use) =>
    use(
      (dto?: Partial<RegisterUserDto>) =>
        http.auth.registerUser({
          defaultUser: dto,
          role: dto?.role ?? 'MEMBRE_COMMUN',
        }) as any, // oxlint-disable-line
    ),

  newMemberApp: async ({ anonymousApp: app, registerUser }, use) => {
    return use(
      async <Role extends UserRole>(dto: Partial<Omit<RegisterUserDto, 'role'>> & { role: Role }) => {
        const user = await registerUser<Role>(dto);
        await app.pages.login.goto();
        await app.pages.login.with({ email: user.email, password: user.password });

        const memberApp = new TestMemberApp<Role>(app.page, user);
        await memberApp.pages.home.goto();

        return memberApp;
      },
    );
  },
});
