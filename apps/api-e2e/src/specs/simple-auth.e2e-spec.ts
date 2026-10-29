import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import { strongPassword } from '../fixtures/auth.fixture.ts';
import { makeStepsFixtures } from '../steps.ts';
import { cookieHeader } from '../utils/cookies.ts';

test.describe('Simple Auth E2E', () => {
  test.describe('Given a registered user', () => {
    test('should log in with a password that contains a colon', async ({ baseUrl, expect, registerUser }) => {
      const user = await registerUser({
        email: `colon+${randomUUID()}@example.com`,
        firstName: 'Ada',
        gender: 'FEMALE',
        lastName: 'Lovelace',
        password: `${strongPassword()}:${randomUUID()}`,
        role: 'MEMBRE_COMMUN',
      });

      const { response } = await makeStepsFixtures({ baseUrl }).auth.login({
        headers: { authorization: `Basic ${Buffer.from(`${user.email}:${user.password}`).toString('base64')}` },
      });
      expect(response?.status).toBe(204);
    });

    test('should rehash at the configured cost a password hashed at another one', async ({
      baseUrl,
      expect,
      registerUser,
      sql,
    }) => {
      const user = await registerUser('MEMBRE_COMMUN');
      // "correct horse battery staple" hashed at cost 5, while .env.e2e sets 4
      const hashedAtCost5 = '$2b$05$5EjEZdFUHuxIAYhtTNVriOQTLDIpCDTyRN772iX5a34kVzhCySgvC';
      await sql`update identity_and_access_context.users set password = ${hashedAtCost5} where id = ${user.id}`;

      await makeStepsFixtures({ baseUrl }).auth.login({
        body: { email: user.email, password: 'correct horse battery staple' },
        throwOnError: true,
      });

      const [row] = await sql<{ password: string }[]>`
        select password from identity_and_access_context.users where id = ${user.id}
      `;
      expect(row?.password).toMatch(/^\$2b\$04\$/);
    });
  });

  test.describe('Given a logged-in user', () => {
    test('should have an introspectable session', async ({ expect, member }) => {
      const introspectRes = await member.auth.introspectSession();
      expect(introspectRes.response?.status).toBe(200);
    });

    test('should tell the deployed version', async ({ expect, member }) => {
      const introspectRes = await member.auth.introspectSession();
      expect(introspectRes.response?.headers.get('X-App-Version')).toBe('e2e');
    });

    test('should logout', async ({ expect, member }) => {
      const logoutRes = await member.auth.logout();
      expect(logoutRes.response?.status).toBe(204);

      const [setCookie] = logoutRes.response!.headers.getSetCookie();
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });

  test('should log in with the password a user changed, keeping only the session that changed it', async ({
    baseUrl,
    expect,
    registerUser,
  }) => {
    const user = await registerUser('MEMBRE_COMMUN');
    const anonymous = makeStepsFixtures({ baseUrl });
    const login = (password: string) => anonymous.auth.login({ body: { email: user.email, password } });
    const loggedIn = async () =>
      makeStepsFixtures({ baseUrl, cookies: [cookieHeader((await login(user.password)).response!)] });
    const asCurrent = await loggedIn();
    const asOther = await loggedIn();
    const newPassword = strongPassword();

    await asCurrent.auth.changePassword({
      body: { currentPassword: user.password, newPassword },
      throwOnError: true,
    });

    expect((await login(newPassword)).response?.status).toBe(204);
    expect((await login(user.password)).response?.status).toBe(401);
    expect((await asCurrent.auth.introspectSession()).response?.status).toBe(200);
    expect((await asOther.auth.introspectSession()).response?.status).toBe(401);
  });

  test('should act as the impersonated user until the impersonation is over', async ({
    baseUrl,
    expect,
    registerUser,
  }) => {
    const admin = await registerUser('ADMIN');
    const impersonated = await registerUser('MEMBRE_COMMUN');
    const { response: login } = await makeStepsFixtures({ baseUrl }).auth.login({
      body: { email: admin.email, password: admin.password },
      throwOnError: true,
    });
    const adminSession = cookieHeader(login);
    const asAdmin = makeStepsFixtures({ baseUrl, cookies: [adminSession] });

    const started = await asAdmin.auth.impersonate({ path: { userId: impersonated.id }, throwOnError: true });
    const impersonation = `${adminSession}; ${cookieHeader(started.response)}`;
    const asImpersonated = makeStepsFixtures({ baseUrl, cookies: [impersonation] });

    const during = await asImpersonated.auth.introspectSession();
    expect(during.data).toMatchObject({ isImpersonated: true, role: 'MEMBRE_COMMUN', userId: impersonated.id });

    const ended = await asImpersonated.auth.logout();
    expect(ended.response?.status).toBe(204);

    // logging out of an impersonation only ends it: the admin keeps their own session
    const after = await asAdmin.auth.introspectSession();
    expect(after.data).toMatchObject({
      isAdmin: true,
      isImpersonated: false,
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      userId: admin.id,
    });
    const revoked = await asImpersonated.auth.introspectSession();
    expect(revoked.response?.status).toBe(401);
  });

  test('should describe the logged-in user by the role an admin gave them', async ({ admin, baseUrl, expect }) => {
    const credentials = { email: `officer+${randomUUID()}@example.fr`, password: strongPassword() };
    await admin.administration.createUser({
      body: { ...credentials, firstName: 'Joséphine', gender: 'FEMALE', lastName: 'Pibault', role: 'OFFICER' },
      throwOnError: true,
    });
    const { response } = await makeStepsFixtures({ baseUrl }).auth.login({ body: credentials, throwOnError: true });
    const officer = makeStepsFixtures({ baseUrl, cookies: [cookieHeader(response)] });

    const { data } = await officer.auth.introspectSession({ throwOnError: true });

    expect(data.displayedRole).toEqual({ group: 'SECRETARIAT', id: 'OFFICER', label: 'Agente du pôle nomination' });
  });
});
