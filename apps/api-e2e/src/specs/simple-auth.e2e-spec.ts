import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import { makeStepsFixtures } from '../steps.ts';

test.describe('Simple Auth E2E', () => {
  test.describe('Given a registered user', () => {
    test('should log in with a password that contains a colon', async ({ baseUrl, expect, registerUser }) => {
      const user = await registerUser({
        email: `colon+${randomUUID()}@example.com`,
        firstName: 'Ada',
        gender: 'FEMALE',
        lastName: 'Lovelace',
        password: `${randomUUID()}:${randomUUID()}`,
        role: 'MEMBRE_COMMUN',
      });

      const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
        headers: { authorization: `Basic ${Buffer.from(`${user.email}:${user.password}`).toString('base64')}` },
      });
      expect(response?.status).toBe(204);
    });
  });

  test.describe('Given a logged-in user', () => {
    test('should have an introspectable session', async ({ member, expect }) => {
      const introspectRes = await member.auth.introspectSession();
      expect(introspectRes.response?.status).toBe(200);
    });

    test('should tell the deployed version', async ({ member, expect }) => {
      const introspectRes = await member.auth.introspectSession();
      expect(introspectRes.response?.headers.get('X-App-Version')).toBe('e2e');
    });

    test('should logout', async ({ member, expect }) => {
      const logoutRes = await member.auth.logout();
      expect(logoutRes.response?.status).toBe(204);

      const [setCookie] = logoutRes.response!.headers.getSetCookie();
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });
});
