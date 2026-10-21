import { emptyDatabase } from '../empty-database';
import { test as setup } from '../fixtures';

setup('auth as SG', async ({ registerUser, page, http }) => {
  await emptyDatabase();

  const { email, password } = await registerUser({ isAdmin: true, role: 'ADJOINT_SECRETAIRE_GENERAL' });

  const response = await http.auth.login({ email, password });
  setup.expect(response.ok()).toBe(true);

  const { cookies } = await http.http.storageState();
  await page.context().addCookies(cookies);
  await page.context().storageState({ path: 'playwright/.auth/sg.json' });
});
