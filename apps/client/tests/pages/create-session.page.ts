import type { Locator } from '@playwright/test';

import type { TestApp } from './test-app';

export class CreateSessionPage {
  constructor(private readonly app: TestApp) {}

  async goto(): Promise<void> {
    await this.app.nav.getByText('Gérer une session').click();
    await this.app.page.getByRole('button', { name: 'Créer une session' }).click();
    await this.formName.waitFor();
  }

  async with(options: {
    name: string;
    date: Date;
    formation: 'PARQUET' | 'SIEGE';
    observationClosingDate: Date;
    dueDate?: Date;
    positionStartDate?: Date;
    file: File;
  }): Promise<void> {
    await this.fillName(options.name);
    await this.fillDate(options.date);
    await this.fillFormation(options.formation);
    await this.fillObservationClosingDate(options.observationClosingDate);
    if (options.dueDate) await this.fillDueDate(options.dueDate);
    if (options.positionStartDate) await this.fillPositionStartDate(options.positionStartDate);
    await this.fillFile(options.file);

    await this.formSubmitButton.click();

    await this.successfullyCreatedSessionAlert(options.name).getByRole('button').click();
  }

  private get dialog(): Locator {
    return this.app.page.getByRole('dialog', { name: 'Créer une session depuis une extraction LODAM' });
  }

  private get formName(): Locator {
    return this.dialog.getByLabel('Nom de la transparence');
  }

  private fillDate(date: Date): Promise<void> {
    return this.fillDateInput(this.dialog.getByLabel('Date de la transparence'), date);
  }

  private fillObservationClosingDate(date: Date): Promise<void> {
    return this.fillDateInput(this.dialog.getByLabel("Clôture du délai d'observation"), date);
  }

  private fillDueDate(date: Date): Promise<void> {
    return this.fillDateInput(this.dialog.getByLabel("Date d'échéance"), date);
  }

  private fillPositionStartDate(date: Date): Promise<void> {
    return this.fillDateInput(this.dialog.getByLabel('Date de prise de poste'), date);
  }

  private async fillFormation(formation: 'SIEGE' | 'PARQUET'): Promise<void> {
    await this.dialog
      .getByLabel('Formation')
      .selectOption({ label: formation === 'PARQUET' ? 'Parquet' : 'Siège' });
  }

  private async fillFile(file: File): Promise<void> {
    return this.dialog.getByLabel('Extraction LODAM').setInputFiles({
      name: file.name,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
    });
  }

  private fillName(name: string): Promise<void> {
    return this.formName.fill(name);
  }

  private fillDateInput(locator: Locator, date: Date): Promise<void> {
    return locator.fill(date.toISOString().split('T')[0]);
  }

  private get formSubmitButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Enregistrer' });
  }

  private successfullyCreatedSessionAlert(name: string): Locator {
    return this.app.page.locator('.fr-alert.fr-alert--success', {
      hasText: `Session «\u00A0${name}\u00A0» créée`,
    });
  }
}
