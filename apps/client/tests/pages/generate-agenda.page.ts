import type { Locator } from '@playwright/test';

import type { TestApp } from './test-app';

export class GenerateAgendaPage {
  constructor(private readonly app: TestApp) {}

  async goto(): Promise<this> {
    const name = /Générer l'ODJ \(\d+\)/;
    await this.app.page.getByRole('button', { name }).click();
    await this.app.page.getByRole('heading', { name: 'Sélection des propositions' }).waitFor();

    return this;
  }

  get addToAgendaButton(): Locator {
    return this.app.page.getByRole('button', { name: "Ajouter à l'ODJ" });
  }

  get secretarySelect(): Locator {
    return this.app.page.getByLabel('Secrétaire général');
  }

  get chairmanSelect(): Locator {
    return this.app.page.getByLabel('Président de séance');
  }

  goToNextStep(): Promise<void> {
    return this.app.page.getByRole('button', { name: /Définir les données de l'ODJ/ }).click();
  }

  async fill(options: {
    date?: Date;
    secretary?: string;
    chairman?: string;
    sessionMeetingDate: Date;
  }): Promise<{ agendaId: string }> {
    await this.app.page
      .getByLabel('Date de la séance')
      .fill(options.sessionMeetingDate.toISOString().split('T')[0]!);

    if (options.date) {
      await this.app.page
        .getByLabel("Date de l'ordre du jour")
        .fill(options.date.toISOString().split('T')[0]!);
    }

    if (options.secretary) {
      await this.secretarySelect.selectOption(options.secretary);
    }

    if (options.chairman) {
      await this.chairmanSelect.selectOption(options.chairman);
    }

    await this.app.page.getByRole('button', { name: "Générer l'ordre du jour" }).click();
    const validationPattern = new URLPattern({
      pathname: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
    });
    await this.app.page.waitForURL((url) => validationPattern.test(url));
    const { agendaId } = validationPattern.exec(this.app.page.url())!.pathname.groups;

    return { agendaId: agendaId! };
  }
}
