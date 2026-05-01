import type { Locator, Page } from '@playwright/test';
import type { RegisteredUser, UserRole } from '../fixtures/auth.fixture';
import { MemberHomePage } from './members/home.page';

/** this is intended to be the entry point for an app from a member point of view */
export class TestMemberApp<Role extends UserRole = UserRole> {
  readonly pages = {
    home: new MemberHomePage(this)
  };

  constructor(
    readonly page: Page,
    readonly member: RegisteredUser<Role>
  ) {}

  get homeLink(): Locator {
    return this.page.getByRole('link', { name: 'Fondation' });
  }
}
