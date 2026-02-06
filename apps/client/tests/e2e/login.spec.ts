import { test } from '../fixtures';

test.describe('Login Page', () => {
  test('user can log in', async ({ userSg, app }) => {
    await app.pages.login.goto();
    await app.pages.login.login({ email: userSg.email, password: userSg.password });
  });
});
