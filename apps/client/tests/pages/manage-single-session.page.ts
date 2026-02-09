import type { Locator } from '@playwright/test';
import type { TestApp } from './test-app';

export class ManageSingleSessionPage {
  constructor(private readonly app: TestApp) {}

  waitFor(): Promise<void> {
    return this.app.page.locator('h1:has-text("Gérer une session")').waitFor();
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
    return this.app.page.getByRole('button', { name: 'Sélectionner' });
  }

  get searchReporterInput(): Locator {
    return this.app.page.getByRole('textbox', { name: 'Rechercher un rapporteur' });
  }

  get saveAffectationsButton(): Locator {
    return this.app.page.getByRole('button', { name: 'Sauvegarder' });
  }
}
