import { test } from '../fixtures.ts';
import { strongPassword } from '../fixtures/auth.fixture.ts';
import { makeStepsFixtures } from '../steps.ts';
import { cookieHeader } from '../utils/cookies.ts';

test.describe('Administration', () => {
  test('should let a user log in with the email and password an admin gave them, and no longer with the former ones', async ({
    admin,
    baseUrl,
    expect,
    registerUser,
  }) => {
    const user = await registerUser('MEMBRE_COMMUN');
    const credentials = { email: `renamed+${crypto.randomUUID()}@example.fr`, password: strongPassword() };

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

  test('should let an account an admin created log in with its initial password, listed under the role it was given', async ({
    admin,
    baseUrl,
    expect,
    sql,
  }) => {
    const credentials = { email: `created+${crypto.randomUUID()}@example.fr`, password: strongPassword() };

    const { data: created } = await admin.administration.createUser({
      body: {
        ...credentials,
        firstName: 'Joséphine',
        gender: 'FEMALE',
        lastName: 'Pibault',
        role: 'OFFICER',
      },
      throwOnError: true,
    });

    const anonymous = makeStepsFixtures({ baseUrl });
    const { response } = await anonymous.auth.login({ body: credentials });
    expect(response?.status).toBe(204);
    const { data: officers } = await admin.administration.listUsers({
      query: { roles: ['OFFICER'], search: credentials.email },
      throwOnError: true,
    });
    expect(officers.items).toEqual([
      expect.objectContaining({ id: created.id, isAdmin: false, role: 'OFFICER', status: 'ACTIVE' }),
    ]);
    const changes = await sql`
      select status, changed_by as "changedBy" from identity_and_access_context.user_status_changes
      where user_id = ${created.id}`;
    expect(changes).toEqual([{ changedBy: admin['@user']!.id, status: 'ACTIVE' }]);
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
    sql,
  }) => {
    const path = { userId: agent['@user']!.id };
    const { data: me } = await agent.auth.introspectSession({ throwOnError: true });

    await admin.administration.promoteToAdmin({ path, throwOnError: true });

    const promoted = await agent.auth.introspectSession();
    expect(promoted.data).toMatchObject({ isAdmin: true, role: 'ADJOINT_SECRETAIRE_GENERAL' });
    const listed = await admin.administration.listUsers({ query: { search: me.lastName } });
    expect(listed.data!.items).toContainEqual(expect.objectContaining({ id: path.userId, isAdmin: true }));
    const detailed = await admin.administration.detailsUser({ path });
    expect(detailed.data!.isAdmin).toBe(true);

    await admin.administration.demoteFromAdmin({ path, throwOnError: true });

    const demoted = await agent.auth.introspectSession();
    expect(demoted.data).toMatchObject({ isAdmin: false, role: 'ADJOINT_SECRETAIRE_GENERAL' });
    const changes = await sql`
      select change, changed_by as "changedBy" from identity_and_access_context.admin_right_changes
      where user_id = ${path.userId} order by changed_at`;
    expect(changes).toEqual([
      { change: 'GRANTED', changedBy: admin['@user']!.id },
      { change: 'REVOKED', changedBy: admin['@user']!.id },
    ]);
  });

  test('should record the admin right once when it is given twice at the same time', async ({
    admin,
    agent,
    expect,
    sql,
  }) => {
    const path = { userId: agent['@user']!.id };

    const responses = await Promise.all([
      admin.administration.promoteToAdmin({ path }),
      admin.administration.promoteToAdmin({ path }),
    ]);
    expect(responses.map(({ response }) => response?.status)).toEqual([204, 204]);

    const changes = await sql`
      select change from identity_and_access_context.admin_right_changes where user_id = ${path.userId}`;
    expect(changes).toEqual([{ change: 'GRANTED' }]);
  });

  test('should refuse the role of a member to an admin until their admin right is taken back', async ({
    admin,
    agent,
    expect,
  }) => {
    const path = { userId: agent['@user']!.id };
    await admin.administration.promoteToAdmin({ path, throwOnError: true });

    const refused = await admin.administration.updateRole({ body: { role: 'MEMBRE_SIEGE' }, path });
    expect(refused.response?.status).toBe(400);

    await admin.administration.demoteFromAdmin({ path, throwOnError: true });
    const updated = await admin.administration.updateRole({ body: { role: 'MEMBRE_SIEGE' }, path });
    expect(updated.response?.status).toBe(204);
  });

  test('should name who holds a title, with the role they keep once it is given to someone else', async ({
    admin,
    expect,
    registerUser,
  }) => {
    const holder = await registerUser('MEMBRE_DU_PARQUET');
    await admin.administration.updateRole({
      body: { role: 'DEPUTY_PRESIDENT_PARQUET' },
      path: { userId: holder.id },
      throwOnError: true,
    });

    const { data } = await admin.administration.listTitleHolders({ throwOnError: true });

    expect(data.items.find(({ role }) => role === 'DEPUTY_PRESIDENT_PARQUET')?.holder).toMatchObject({
      id: holder.id,
      nextRole: 'MEMBRE_PARQUET',
    });
  });

  test.describe('Given a logged-in member', () => {
    test('should log the member out when an admin changes the password', async ({ admin, expect, member }) => {
      await admin.administration.updatePassword({
        body: { password: strongPassword() },
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
        body: { password: strongPassword() },
        path: { userId: admin['@user']!.id },
        throwOnError: true,
      });

      const { response } = await admin.auth.introspectSession();
      expect(response?.status).toBe(200);
    });
  });

  test.describe('Given an impersonated member', () => {
    test('should end the impersonation once the member is deactivated, and let the admin log in again', async ({
      admin,
      baseUrl,
      expect,
      registerUser,
    }) => {
      const impersonator = await registerUser('ADMIN');
      const impersonated = await registerUser('MEMBRE_COMMUN');
      const anonymous = makeStepsFixtures({ baseUrl });
      const credentials = { email: impersonator.email, password: impersonator.password };
      const { response: login } = await anonymous.auth.login({ body: credentials, throwOnError: true });
      const adminSession = cookieHeader(login);
      const started = await makeStepsFixtures({ baseUrl, cookies: [adminSession] }).auth.impersonate({
        path: { userId: impersonated.id },
        throwOnError: true,
      });
      const asImpersonated = makeStepsFixtures({
        baseUrl,
        cookies: [`${adminSession}; ${cookieHeader(started.response)}`],
      });

      await admin.administration.deactivate({ path: { userId: impersonated.id }, throwOnError: true });

      const during = await asImpersonated.auth.introspectSession();
      expect(during.response?.status).toBe(401);
      const { response: again } = await anonymous.auth.login({ body: credentials, throwOnError: true });
      expect(again.headers.getSetCookie()).toContainEqual(
        expect.stringMatching(/^impersonationId=.*Expires=Thu, 01 Jan 1970/),
      );
    });
  });

  test.describe('Given a deactivated member', () => {
    test('should detail the account with its status changes since its creation, the latest first', async ({
      admin,
      expect,
      registerUser,
    }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });
      await admin.administration.reactivate({ path: { userId: user.id }, throwOnError: true });
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { data } = await admin.administration.detailsUser({
        path: { userId: user.id },
        throwOnError: true,
      });
      expect(data.statusChanges.map(({ status }) => status)).toEqual([
        'DEACTIVATED',
        'ACTIVE',
        'DEACTIVATED',
        'ACTIVE',
      ]);
      expect(data.deactivatedAt).toBe(data.statusChanges[0]!.changedAt);
    });

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

    test('should list the member with their status when every status is asked for', async ({
      admin,
      expect,
      registerUser,
    }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      await admin.administration.deactivate({ path: { userId: user.id }, throwOnError: true });

      const { data } = await admin.members.listMembers({
        query: { search: user.email, statuses: ['ACTIVE', 'DEACTIVATED'] },
        throwOnError: true,
      });
      expect(data.items).toEqual([expect.objectContaining({ id: user.id, status: 'DEACTIVATED' })]);
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
