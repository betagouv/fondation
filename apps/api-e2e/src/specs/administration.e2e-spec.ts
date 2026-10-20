import { test } from '../fixtures.ts';
import { makeStepsFixtures } from '../steps.ts';

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

    test('should log the member out when an admin deactivates the account', async ({ admin, member, expect }) => {
      await admin.administration.deactivate({ path: { userId: member['@user']!.id }, throwOnError: true });

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

  test.describe('Given a deactivated member', () => {
    test('should refuse the login of the member', async ({ admin, baseUrl, registerUser, expect }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
        body: { email: user.email, password: user.password },
      });
      expect(response?.status).toBe(401);
    });

    test('should let the member log in again once reactivated', async ({ admin, baseUrl, registerUser, expect }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });
      await admin.administration.reactivate({ path: { userId: user.id }, throwOnError: true });

      const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
        body: { email: user.email, password: user.password },
      });
      expect(response?.status).toBe(204);
    });

    test('should refuse to impersonate the member', async ({ admin, expect, registerUser }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { response } = await admin.auth.impersonate({ path: { userId: user.id } });
      expect(response?.status).toBe(400);
    });

    test('should leave the member out of the members', async ({ admin, registerUser, expect }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { data } = await admin.members.listMembers({ query: { search: user.email }, throwOnError: true });
      expect(data.items).toEqual([]);
    });

    test('should list the member among the deactivated users only', async ({ admin, registerUser, expect }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { data: deactivated } = await admin.administration.listUsers({
        query: { search: user.email, statuses: ['DEACTIVATED'] },
        throwOnError: true,
      });
      const { data: active } = await admin.administration.listUsers({
        query: { search: user.email, statuses: ['ACTIVE'] },
        throwOnError: true,
      });

      expect(deactivated.items).toEqual([expect.objectContaining({ id: user.id, status: 'DEACTIVATED' })]);
      expect(active.items).toEqual([]);
    });
  });
});
