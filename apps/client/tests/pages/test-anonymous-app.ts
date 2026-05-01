import type { Locator, Page } from '@playwright/test';
import { LoginPage } from './login.page';

export class TestAnonymousApp {
  readonly pages = {
    login: new LoginPage(this)
  };

  constructor(readonly page: Page) {}

  get userLogoutButton(): Locator {
    return this.page.getByRole(`banner`).getByRole('button', { name: 'Se déconnecter' });
  }
}
