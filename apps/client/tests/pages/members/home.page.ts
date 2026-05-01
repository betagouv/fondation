import type { Locator } from '@playwright/test';
import type { TestMemberApp } from '../test-member-app';

export class MemberHomePage {
  constructor(readonly app: TestMemberApp) {}

  async goto(): Promise<void> {
    await this.app.homeLink.click();
    await this.app.page
      .getByRole('heading', {
        name: `Bonjour, ${this.app.member.gender === 'MALE' ? 'Monsieur' : 'Madame'} ${this.app.member.lastName.toUpperCase()}.`
      })
      .waitFor();
  }

  affectedSessionLink(sessionName: string): Locator {
    return this.app.page.locator(`h3:has-text("Vos sessions") + ul > li:has-text("${sessionName}")`);
  }

  nonAffectedSessionLink(sessionName: string): Locator {
    return this.app.page.locator(`h3:has-text("Toutes les sessions") + ul > li:has-text("${sessionName}")`);
  }
}
