import type { Locator, Page } from '@playwright/test';
import type { TestApp } from './test-app';

class ExcludeJurisdictionModal {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get search(): Locator {
    return this.page.getByRole('searchbox', { name: 'Rechercher' });
  }

  get listbox(): Locator {
    return this.page.getByRole('listbox', { name: 'Rechercher' });
  }

  async select(name: string): Promise<void> {
    return this.page.getByRole('option', { name }).click({ force: true });
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Sauvegarder' });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Annuler' });
  }

  async close(): Promise<void> {
    await this.page.getByRole('button', { name: 'Fermer' }).click();
  }
}

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

  async openJurisdictionExclusionModal(): Promise<ExcludeJurisdictionModal> {
    await this.app.page.getByRole('button', { name: 'Éditer les juridictions exclues' }).click();
    await this.app.page.getByRole('heading', { name: 'Sélection des juridictions' }).waitFor();

    return new ExcludeJurisdictionModal(this.app);
  }

  memberInfo(
    label:
      | 'Juridictions exclues'
      | 'Personnes exclues'
      | 'Email'
      | 'Mot de passe'
      | 'Nom'
      | 'Prénom'
      | 'Formation'
      | 'Distinction'
      | 'Titre'
  ): Locator {
    return this.app.page.locator(`dt:has-text("${label}") + dd`);
  }
}
