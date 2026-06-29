import { test } from '../fixtures.ts';

test.describe('Simple Auth E2E', () => {
  test.describe('Given a logged-in user', () => {
    test('should have an introspectable session', async ({ member, expect }) => {
      const introspectRes = await member.auth.introspectSession();
      expect(introspectRes.response.status).toBe(200);
    });

    test('should logout', async ({ member, expect }) => {
      const logoutRes = await member.auth.logout();
      expect(logoutRes.response.status).toBe(204);

      const [setCookie] = logoutRes.response.headers.getSetCookie();
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });
});
