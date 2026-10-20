import { test } from '../fixtures.ts';
import { makeStepsFixtures } from '../steps.ts';

test.describe('Administration', () => {
  test('should let a user log in with the email and password an admin gave them, and no longer with the former ones', async ({
    admin,
    baseUrl,
    expect,
    registerUser,
  }) => {
    const user = await registerUser('MEMBRE_COMMUN');
    const credentials = { email: `renamed+${crypto.randomUUID()}@example.fr`, password: crypto.randomUUID() };

    await admin.administration.updateEmail({
      body: { email: credentials.email },
      path: { userId: user.id },
      throwOnError: true,
    });
    await admin.administration.updatePassword({
      body: { password: credentials.password },
      path: { userId: user.id },
      throwOnError: true,
    });

    const anonymous = makeStepsFixtures({ baseUrl });
    const login = async (body: { email: string; password: string }) =>
      (await anonymous.auth.login({ body })).response?.status;
    expect(await login(credentials)).toBe(204);
    expect(await login({ email: user.email, password: credentials.password })).toBe(401);
    expect(await login({ email: credentials.email, password: user.password })).toBe(401);

    const details = await admin.administration.detailsUser({ path: { userId: user.id } });
    expect(details.data!.email).toBe(credentials.email);
  });

  test('should refuse to give a user the email of another one, however it is typed', async ({
    admin,
    baseUrl,
    expect,
    registerUser,
  }) => {
    const owner = await registerUser('MEMBRE_COMMUN');
    const other = await registerUser('MEMBRE_COMMUN');

    for (const email of [owner.email, ` ${owner.email.toUpperCase()} `]) {
      const taken = await admin.administration.updateEmail({ body: { email }, path: { userId: other.id } });
      expect(taken.response?.status).toBe(409);
    }

    // the login matches an email whatever its case, so a second account with it would lock one out
    const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
      body: { email: owner.email, password: owner.password },
    });
    expect(response?.status).toBe(204);
  });

  test('should give an agent the rights of an admin on their next request, until they are taken back', async ({
    admin,
    agent,
    expect,
  }) => {
    const path = { userId: agent['@user']!.id };
    const { data: me } = await agent.auth.introspectSession({ throwOnError: true });

    await admin.administration.promoteToAdmin({ path, throwOnError: true });

    const promoted = await agent.auth.introspectSession();
    expect(promoted.data!.role).toBe('ADMIN');
    const listed = await admin.administration.listUsers({ query: { search: me.lastName } });
    expect(listed.data!.items.map(({ id }) => id)).toContain(path.userId);
    const detailed = await admin.administration.detailsUser({ path });
    expect(detailed.data!.isAdmin).toBe(true);

    await admin.administration.demoteFromAdmin({ path, throwOnError: true });

    const demoted = await agent.auth.introspectSession();
    expect(demoted.data!.role).toBe('ADJOINT_SECRETAIRE_GENERAL');
  });

  test.describe('Given a logged-in member', () => {
    test('should log the member out when an admin changes the password', async ({ admin, expect, member }) => {
      await admin.administration.updatePassword({
        body: { password: crypto.randomUUID() },
        path: { userId: member['@user']!.id },
        throwOnError: true,
      });

      const { response } = await member.auth.introspectSession();
      expect(response?.status).toBe(401);
    });

    test('should log the member out when an admin deactivates the account', async ({ admin, expect, member }) => {
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
    test('should refuse the login of the member', async ({ admin, baseUrl, expect, registerUser }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
        body: { email: user.email, password: user.password },
      });
      expect(response?.status).toBe(401);
    });

    test('should let the member log in again once reactivated', async ({ admin, baseUrl, expect, registerUser }) => {
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

    test('should leave the member out of the members', async ({ admin, expect, registerUser }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { data } = await admin.members.listMembers({ query: { search: user.email }, throwOnError: true });
      expect(data.items).toEqual([]);
    });

    test('should list the member among the deactivated users only', async ({ admin, expect, registerUser }) => {
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
