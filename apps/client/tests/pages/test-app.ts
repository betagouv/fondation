import type { Locator, Page } from '@playwright/test';

import { AdminPage } from './admin.page';
import { CreateSessionPage } from './create-session.page';
import { ManageSessionsPage } from './manage-sessions.page';
import { ManageSingleSessionPage } from './manage-single-session.page';
import { MembersPage } from './members.page';

export class TestApp {
  readonly pages = {
    createSession: new CreateSessionPage(this),
    manageSessions: new ManageSessionsPage(this),
    session: new ManageSingleSessionPage(this),
    members: new MembersPage(this),
    admin: new AdminPage(this),
  };

  constructor(readonly page: Page) {}

  get nav(): Locator {
    return this.page.getByRole(`navigation`, { name: 'Menu principal' });
  }
}
