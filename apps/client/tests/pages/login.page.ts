import type { Locator } from '@playwright/test';

import type { TestApp } from './test-app';

export class LoginPage {
  constructor(private readonly app: TestApp) {}

  async goto(): Promise<void> {
    await this.app.page.goto('/login');
  }

  async with(options: { email: string; password: string }): Promise<void> {
    await this.emailInput.fill(options.email.toLowerCase());
    await this.passwordInput.fill(options.password);
    await this.submitButton.click();

    await this.app.userLogoutButton.waitFor();
  }

  private get emailInput(): Locator {
    return this.app.page.getByLabel('Email');
  }

  private get passwordInput(): Locator {
    return this.app.page.getByLabel('Mot de passe', { exact: true });
  }

  private get submitButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Se connecter' });
  }
}
