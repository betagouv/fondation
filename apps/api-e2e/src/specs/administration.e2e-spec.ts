import { test } from '../fixtures.ts';

test.describe('Administration E2E', () => {
  test.describe('Given a logged-in member', () => {
    test('should log the member out when an admin changes the password', async ({ admin, member, expect }) => {
      await admin.administration.updatePassword({
        body: { password: crypto.randomUUID() },
        path: { userId: member['@user']!.id },
        throwOnError: true,
      });

      const { response } = await member.auth.introspectSession();
      expect(response?.status).toBe(401);
    });
  });

  test.describe('Given a logged-in admin', () => {
    test('should keep the admin logged in when they change their own password', async ({ admin, expect }) => {
      await admin.administration.updatePassword({
        body: { password: crypto.randomUUID() },
        path: { userId: admin['@user']!.id },
        throwOnError: true,
      });

      const { response } = await admin.auth.introspectSession();
      expect(response?.status).toBe(200);
    });
  });
});
