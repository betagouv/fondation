import type { Locator, Page } from '@playwright/test';

import { GenerateAgendaPage } from './generate-agenda.page';
import { GenerateOfficialReportPage } from './generate-official-report.page';
import type { TestApp } from './test-app';

class ObservationModal {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get dialog(): Locator {
    return this.page.locator('#modal-observations');
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
}

class MagistratSidePanel {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get dialog(): Locator {
    return this.page.locator('#magistrat-panel');
  }

  /** Closing keeps the panel mounted so `state: 'hidden'` never resolves */
  get openedDialog(): Locator {
    return this.page.locator('#magistrat-panel:not([inert])');
  }

  get closedDialog(): Locator {
    return this.page.locator('#magistrat-panel[inert]');
  }

  get closeButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Fermer' });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.closedDialog.waitFor();
  }

  private get affectationSection(): Locator {
    return this.dialog.locator('#magistrat-affectation-section');
  }

  private get editAffectationButton(): Locator {
    return this.affectationSection.getByRole('button', { name: 'Modifier' });
  }

  private get saveAffectationButton(): Locator {
    return this.affectationSection.getByRole('button', { name: 'Valider' });
  }

  private async pick(select: Locator, names: readonly (string | RegExp)[]): Promise<void> {
    await select.click();
    for (const name of names) {
      await this.page.getByRole('option', { name }).first().click();
    }
    await this.page.keyboard.press('Escape');
  }

  async editAffectation(selection: {
    priorities?: readonly (string | RegExp)[];
    reporters?: readonly (string | RegExp)[];
  }): Promise<void> {
    await this.editAffectationButton.click();
    await this.saveAffectationButton.waitFor();

    if (selection.priorities) {
      await this.pick(
        this.affectationSection.getByRole('button', { name: 'Définir une priorité' }),
        selection.priorities,
      );
    }
    if (selection.reporters) {
      await this.pick(
        this.affectationSection.getByRole('button', { name: 'Affecter un rapporteur' }),
        selection.reporters,
      );
    }

    await this.saveAffectationButton.click();
    await this.editAffectationButton.waitFor();
  }

  async defineOutcome(name: string | RegExp): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Sélectionner' }).click();
    await this.page.getByRole('option', { name }).first().click();
  }

  private get observationsSection(): Locator {
    return this.dialog.locator('#magistrat-observations-section');
  }

  get addObservationButton(): Locator {
    return this.observationsSection.getByRole('button', { name: 'Ajouter' });
  }

  get editObservationButton(): Locator {
    return this.observationsSection.getByRole('button', { name: "Éditer l'observation" });
  }

  private get fileInput(): Locator {
    return this.dialog.locator('input[type="file"]');
  }

  attachment(name: string): Locator {
    return this.dialog.getByTitle(`Ouvrir ${name} dans un nouvel onglet`, { exact: true });
  }

  private deleteButton(name: string): Locator {
    return this.dialog.getByRole('button', { name: `Supprimer ${name}` });
  }

  private get confirmDeleteButton(): Locator {
    return this.page.locator('#confirmation_modal').getByRole('button', { name: 'Supprimer', exact: true });
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
    await this.confirmDeleteButton.click();
  }
}

type MagistratTarget = string | { number: number } | { name: string };

export class ManageSingleSessionPage {
  constructor(private readonly app: TestApp) {}

  async openMagistratDetails(target: MagistratTarget): Promise<MagistratSidePanel> {
    const panel = new MagistratSidePanel(this.app);

    const trigger =
      typeof target === 'string'
        ? this.app.page.getByRole('button', { name: target })
        : this.sessionRow(target).getByRole('cell').nth(1).getByRole('button');

    await trigger.first().click();
    await panel.openedDialog.waitFor();

    return panel;
  }

  waitFor(sessionName: string): Promise<void> {
    return this.app.page.locator(`h1:has-text("${sessionName}")`).waitFor();
  }

  sessionRow(selector: { number: number } | { name: string }): Locator {
    return this.app.page
      .getByRole('row', {
        name: 'number' in selector ? selector.number.toString(10) : selector.name,
      })
      .first();
  }

  async editAffectation(
    magistrat: MagistratTarget,
    selection: { priorities?: readonly (string | RegExp)[]; reporters?: readonly (string | RegExp)[] },
  ): Promise<void> {
    const panel = await this.openMagistratDetails(magistrat);
    await panel.editAffectation(selection);
    await panel.close();
  }

  async defineOutcome(magistrat: MagistratTarget, outcome: string | RegExp): Promise<void> {
    const panel = await this.openMagistratDetails(magistrat);
    await panel.defineOutcome(outcome);
    await panel.close();
  }

  get publishAffectationsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Publier aux membres' });
  }

  closeMagistratDetails(): Promise<void> {
    return new MagistratSidePanel(this.app).close();
  }

  async openObservationModal(
    target: MagistratTarget,
    mode: 'create' | 'edit' = 'create',
  ): Promise<ObservationModal> {
    const modal = new ObservationModal(this.app);
    const panel = await this.openMagistratDetails(target);

    const trigger = mode === 'create' ? panel.addObservationButton : panel.editObservationButton;
    await trigger.first().click();

    await modal.dialog.waitFor({ state: 'visible' });
    return modal;
  }

  startAgendaGeneration(): Promise<GenerateAgendaPage> {
    const page = new GenerateAgendaPage(this.app);
    return page.goto();
  }

  startOfficialReportGeneration(): Promise<GenerateOfficialReportPage> {
    const page = new GenerateOfficialReportPage(this.app);
    return page.goto();
  }
}
