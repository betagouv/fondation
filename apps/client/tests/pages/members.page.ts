import type { Locator } from '@playwright/test';
import type { TestApp } from './test-app';

export class MembersPage {
  constructor(private readonly app: TestApp) {}

  async goto() {
    await this.app.nav.getByText('Gérer les membres').click();
    await this.app.page.getByRole('heading', { name: 'Membres' }).waitFor();
  }

  memberRow(text: string): Locator {
    return this.app.page.locator('table').getByRole('cell', { name: text });
  }

  async gotoEditMember(fullName: string) {
    await this.app.page.getByRole('link', { name: `Éditer ${fullName}` }).click();
    await this.app.page.getByRole('heading', { name: fullName }).waitFor();
  }

  async openJurisdictionExclusionModal() {
    await this.editExcludedJurisdictionsButton().click();
    await this.app.page.getByRole('heading', { name: 'Sélection des juridictions' }).waitFor();
  }

  editExcludedJurisdictionsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Éditer les juridictions exclues' });
  }
}
