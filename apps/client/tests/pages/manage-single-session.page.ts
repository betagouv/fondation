import type { TestApp } from './test-app';

export class ManageSingleSessionPage {
  constructor(private readonly app: TestApp) {}

  waitFor(): Promise<void> {
    return this.app.page.locator('h1:has-text("Gérer une session")').waitFor();
  }
}
