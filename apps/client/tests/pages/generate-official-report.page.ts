import type { Locator, Page } from '@playwright/test';

import type { TestApp } from './test-app';

class JusticeContactCombobox {
  private readonly page: Page;
  constructor(app: TestApp) {
    this.page = app.page;
  }

  get input(): Locator {
    return this.page.getByLabel('Représentant DSJ');
  }

  fill(contact: string): Promise<void> {
    return this.input.fill(contact);
  }

  blur(): Promise<void> {
    return this.input.blur();
  }

  option(name: string | RegExp): Locator {
    return this.page.getByRole('option', { name }).first();
  }

  button(name: string | RegExp): Locator {
    return this.page.locator(`[role="option"][type="button"]:has-text("${name}")`).first();
  }

  get confirmButton(): Locator {
    return this.page.getByRole('dialog').locator(this.page.getByRole('button', { name: 'Confirmer' }));
  }

  async confirm(): Promise<void> {
    const contactCreated = this.page.waitForResponse(/justice-contacts/);
    await this.confirmButton.click();
    await contactCreated;
  }
}

export class GenerateOfficialReportPage {
  private get agendaSelect(): Locator {
    return this.app.page.getByLabel('Ordre du jour');
  }

  private get chairmanSelect(): Locator {
    return this.app.page.getByLabel('Président de séance');
  }

  private get secretarySelect(): Locator {
    return this.app.page.getByLabel('Secrétaire général');
  }

  private get sessionMeetingDateInput(): Locator {
    return this.app.page.getByLabel('Date de la séance');
  }

  private get startTimeInput(): Locator {
    return this.app.page.getByLabel('Heure de début');
  }

  private get endTimeInput(): Locator {
    return this.app.page.getByLabel('Heure de fin');
  }

  constructor(private readonly app: TestApp) {}

  async goto(): Promise<this> {
    await this.app.page.getByRole('button', { name: 'Générer la documentation' }).click();
    await this.app.page.getByRole('menuitem', { name: 'Procès verbal' }).click();
    await this.app.page.waitForURL(/secretariat-general\/session\/.+\/docs\/pv/);

    return this;
  }

  async fill(options: {
    agendaId: string;
    sessionMeetingDate?: Date;
    startTime: string;
    endTime: string;
    chairman?: string;
    secretary?: string;
  }): Promise<JusticeContactCombobox> {
    await this.agendaSelect.selectOption(options.agendaId);
    await this.startTimeInput.fill(options.startTime);
    await this.endTimeInput.fill(options.endTime);

    if (options.sessionMeetingDate) {
      await this.sessionMeetingDateInput.fill(options.sessionMeetingDate.toISOString().split('T')[0]);
    }

    if (options.chairman) {
      await this.chairmanSelect.selectOption(options.chairman);
    }

    if (options.secretary) {
      await this.secretarySelect.selectOption(options.secretary);
    }

    const combobox = new JusticeContactCombobox(this.app);
    return combobox;
  }

  async submit(): Promise<void> {
    await this.app.page.getByRole('button', { name: 'Générer le PV' }).click();
    await this.app.page.waitForURL(/validation/);
  }
}
