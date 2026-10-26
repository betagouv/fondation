import type { Locator, Page } from '@playwright/test';

import { LoginPage } from './login.page';

export class TestAnonymousApp {
  readonly pages = {
    login: new LoginPage(this),
  };

  constructor(readonly page: Page) {}

  get userMenuButton(): Locator {
    // the DSFR copies the header's quick access into the mobile menu, hidden on a desktop
    return this.page.getByRole(`banner`).locator('button[aria-haspopup="menu"]:visible');
  }
}
