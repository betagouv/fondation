import type { Locator, Page } from '@playwright/test';

import { CreateSessionPage } from './create-session.page';
import { LoginPage } from './login.page';
import { ManageSessionsPage } from './manage-sessions.page';
import { ManageSingleSessionPage } from './manage-single-session.page';
import { MembersPage } from './members.page';

export class TestApp {
  readonly pages = {
    login: new LoginPage(this),
    createSession: new CreateSessionPage(this),
    manageSessions: new ManageSessionsPage(this),
    session: new ManageSingleSessionPage(this),
    members: new MembersPage(this)
  };

  constructor(readonly page: Page) {}

  get userLogoutButton(): Locator {
    return this.page.getByRole(`banner`).getByRole('button', { name: 'Se déconnecter' });
  }

  get nav(): Locator {
    return this.page.getByRole(`navigation`);
  }
}
