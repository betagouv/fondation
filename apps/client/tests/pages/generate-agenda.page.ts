import type { Locator } from '@playwright/test';

import type { TestApp } from './test-app';

export class GenerateAgendaPage {
  constructor(private readonly app: TestApp) {}

  async goto(): Promise<this> {
    await this.app.page.getByRole('button', { name: 'Générer la documentation' }).click();
    await this.app.page.getByRole('menuitem', { name: 'Ordre du jour' }).click();
    await this.app.page
      .getByRole('heading', { name: "Définir les informations de l'ordre du jour" })
      .waitFor();

    return this;
  }

  get selectAllFilesCheckbox(): Locator {
    return this.app.page.getByRole('checkbox', { name: /toutes les propositions( éligibles)?$/ });
  }

  get selectedCount(): Locator {
    return this.app.page.getByText(/propositions? sélectionnées?|Aucune proposition sélectionnée/);
  }

  get chairmanSelect(): Locator {
    return this.app.page.getByLabel('Président de séance');
  }

  selectFile(selector: { name: string }): Promise<void> {
    return this.app.page.getByRole('row', { name: selector.name }).getByRole('checkbox').click();
  }

  async fillMetadata(options: { chairman: string; date?: Date; sessionMeetingDate: Date }): Promise<void> {
    await this.app.page
      .getByLabel('Date de la séance de restitution')
      .fill(options.sessionMeetingDate.toISOString().split('T')[0]!);

    if (options.date) {
      await this.app.page
        .getByLabel("Date de création de l'ordre du jour")
        .fill(options.date.toISOString().split('T')[0]!);
    }

    await this.chairmanSelect.selectOption(options.chairman);

    await this.app.page.getByRole('button', { name: 'Continuer' }).click();
    await this.app.page.getByRole('heading', { name: 'Sélectionnez les propositions' }).waitFor();
  }

  async submit(): Promise<{ agendaId: string }> {
    await this.app.page.getByRole('button', { name: "Générer l'ordre du jour" }).click();

    const validationPattern = new URLPattern({
      pathname: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
    });
    await this.app.page.waitForURL((url) => validationPattern.test(url));
    const { agendaId } = validationPattern.exec(this.app.page.url())!.pathname.groups;

    return { agendaId: agendaId! };
  }
}
