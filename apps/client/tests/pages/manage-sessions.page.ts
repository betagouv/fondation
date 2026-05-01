import type { Locator } from '@playwright/test';
import type { TestApp } from './test-app';

export class ManageSessionsPage {
  constructor(private readonly app: TestApp) {}

  async goto() {
    await this.app.nav.getByText('Gérer une session').click();
    await this.app.page.locator('table thead').getByText('Intitulé de la session').waitFor();
    await this.app.page.getByRole('cell', { name: 'Chargement...' }).isHidden();
  }

  sessionRow(text: string): Locator {
    return this.app.page.locator('table').getByRole('link', { name: text });
  }

  get dateHeader(): Locator {
    return this.app.page.getByRole('columnheader', { name: 'Date de publication' });
  }
}
