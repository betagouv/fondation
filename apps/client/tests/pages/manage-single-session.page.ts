import type { Locator } from '@playwright/test';
import type { TestApp } from './test-app';

export class ManageSingleSessionPage {
  constructor(private readonly app: TestApp) {}

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
        name: 'number' in selector ? selector.number.toString(10) : selector.name
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
    return this.app.page.getByRole('button', { name: 'Actions groupées' });
  }
}
