import { test } from '../fixtures';

test.describe('Login Page', () => {
  test('user can log in', async ({ userSg, anonymousApp: app }) => {
    await app.pages.login.goto();
    await app.pages.login.with({ email: userSg.email, password: userSg.password });
  });
});
