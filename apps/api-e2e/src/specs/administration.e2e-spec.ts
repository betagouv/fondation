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
});
