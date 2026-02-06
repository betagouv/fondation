import type { Locator, Page } from '@playwright/test';

import { LoginPage } from './login.page';

type Pages = { login: LoginPage };

export class TestApp {
  readonly pages: Pages;

  constructor(readonly page: Page) {
    this.pages = { login: new LoginPage(this) };
  }

  userLogoutButton(): Locator {
    return this.page.locator(`[role="banner"]`).getByRole('button', { name: 'Se déconnecter' });
  }
}

export type App = Omit<TestApp, 'pages'>;
