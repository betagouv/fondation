import type { Locator } from '@playwright/test';

import type { App } from './test-app';

export class LoginPage {
  constructor(private readonly app: App) {}

  async goto(): Promise<void> {
    await this.app.page.goto('/login');
  }

  async login(options: { email: string; password: string }): Promise<void> {
    await this.emailInput.fill(options.email);
    await this.passwordInput.fill(options.password);
    await this.submitButton.click();

    await this.app.userLogoutButton().waitFor();
  }

  private get emailInput(): Locator {
    return this.app.page.locator('input[name="email"]');
  }

  private get passwordInput(): Locator {
    return this.app.page.locator('input[name="password"]');
  }

  private get submitButton(): Locator {
    return this.app.page.locator('button[type="submit"]');
  }
}
