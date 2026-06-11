import type { Locator, Page } from '@playwright/test';

import type { TestApp } from './test-app';

class ObservationModal {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get inputDate(): Locator {
    return this.page.getByLabel('Date de réception');
  }

  async fillDate(date: Date = new Date()): Promise<void> {
    await this.inputDate.fill(date.toISOString().split('T')[0]);
  }

  get inputMagistrat(): Locator {
    return this.page.getByLabel('Magistrat observant');
  }

  async searchMagistrat(toSearch: string): Promise<void> {
    await this.inputMagistrat.fill(toSearch);
  }

  get magistratsListbox(): Locator {
    return this.page.getByRole('listbox');
  }

  magistratsOption(name?: string | RegExp): Locator {
    return this.page.getByRole('option', { name });
  }

  magistratsSelectedButton(name?: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  get inputHistory(): Locator {
    return this.page.getByLabel('Historique observant');
  }

  async fillHistory(history: string): Promise<void> {
    await this.inputHistory.pressSequentially(history);
    await this.inputHistory.blur();
  }

  get inputAttachments(): Locator {
    return this.page.getByLabel('Pièces jointes', {});
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /(?:Créer|Enregistrer)/ });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Annuler' });
  }

  get backButton(): Locator {
    return this.page.getByRole('button', { name: 'Annuler' });
  }

  get closeButton(): Locator {
    return this.dialog.locator(this.page.getByRole('button', { name: 'Fermer' })).first();
  }

  get editObservationButton(): Locator {
    return this.page.getByRole('button', { name: 'Éditer' });
  }
}

class MagistratDetailsModal {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  private get fileInput(): Locator {
    return this.dialog.locator('input[type="file"]');
  }

  attachment(name: string): Locator {
    return this.dialog.getByRole('button', { name, exact: true });
  }

  private deleteButton(name: string): Locator {
    return this.dialog.getByRole('button', { name: `Supprimer ${name}` });
  }

  async addAttachment(file: File): Promise<void> {
    await this.fileInput.setInputFiles({
      name: file.name,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
    });
  }

  async deleteAttachment(name: string): Promise<void> {
    await this.deleteButton(name).click();
  }
}

export class ManageSingleSessionPage {
  constructor(private readonly app: TestApp) {}

  async openMagistratDetails(name: string): Promise<MagistratDetailsModal> {
    const modal = new MagistratDetailsModal(this.app);

    await this.app.page.getByRole('button', { name }).first().click();
    await modal.dialog.waitFor({ state: 'visible' });

    return modal;
  }

  waitFor(sessionName: string): Promise<void> {
    return this.app.page.locator(`h1:has-text("${sessionName}")`).waitFor();
  }

  get switchToEditModeButton(): Locator {
    return this.app.page.getByTitle('Éditer les dossiers');
  }

  get switchToReadModeButton(): Locator {
    return this.app.page.getByTitle('Revenir au mode lecture');
  }

  sessionRow(selector: { number: number } | { name: string }): Locator {
    return this.app.page
      .getByRole('row', {
        name: 'number' in selector ? selector.number.toString(10) : selector.name,
      })
      .first();
  }

  get selectReporterButton(): Locator {
    return this.app.page.locator('button[title="Sélectionner des rapporteurs"]');
  }

  get searchReporterInput(): Locator {
    return this.app.page.getByRole('textbox', { name: 'Rechercher un rapporteur' });
  }

  get saveAffectationsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Sauvegarder' });
  }

  get prioritiesSelectBox(): Locator {
    return this.app.page.locator('button[title="Sélectionner les priorités"]');
  }

  priorityCheckbox(options?: { name: 'Étoilé' | 'Outre-mer' | 'Profilé' }): Locator {
    return this.app.page.getByRole('checkbox', { name: options?.name });
  }

  get batchActionsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Actions', exact: true });
  }

  get publishAffectationsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Publier aux membres' });
  }

  get createObservationButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Ajouter' });
  }

  get editObservationButton(): Locator {
    return this.app.page.getByRole('button', { name: /Voir \(\d+\)/ });
  }

  async openObservationModal(locator: { name: string } | { number: number }): Promise<ObservationModal> {
    const modal = new ObservationModal(this.app);

    const row = this.sessionRow(locator);
    await row.locator(this.createObservationButton).or(row.locator(this.editObservationButton)).click();

    await modal.dialog.waitFor({ state: 'visible' });
    return modal;
  }
}
