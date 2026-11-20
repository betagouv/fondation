import type { Locator } from '@playwright/test';

import type { TestMemberApp } from '../test-member-app';

export class MemberHomePage {
  constructor(readonly app: TestMemberApp) {}

  async goto(): Promise<void> {
    await this.app.homeLink.click();
    const civility = `${this.app.member.gender === 'MALE' ? 'Monsieur' : 'Madame'} ${this.app.member.lastName.toUpperCase()}`;
    const escaped = civility.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await this.app.page
      .getByRole('heading', { level: 1, name: new RegExp(`^(Bonjour|Bonsoir), ${escaped}$`) })
      .waitFor();
  }

  affectedSessionLink(sessionName: string): Locator {
    return this.sessionCard(sessionName)
      .filter({ has: this.filesByState })
      .getByRole('heading', { level: 3 })
      .getByRole('link');
  }

  nonAffectedSessionLink(sessionName: string): Locator {
    return this.sessionCard(sessionName)
      .filter({ hasNot: this.filesByState })
      .getByRole('heading', { level: 3 })
      .getByRole('link');
  }

  private get filesByState(): Locator {
    return this.app.page.getByRole('list', { name: 'Vos dossiers par état' });
  }

  private sessionCard(sessionName: string): Locator {
    return this.app.page.getByRole('article').filter({ hasText: sessionName });
  }
}
