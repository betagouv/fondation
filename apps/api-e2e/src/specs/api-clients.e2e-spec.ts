import { test } from '../fixtures.ts';
import type { Client } from '../generated/api/client/index.ts';
import { apiClients as api, magistrats } from '../generated/api/sdk.ts';
import { makeHttpClient } from '../steps.ts';

test.describe('api clients', () => {
  test('should exchange the identifier and the secret of a client for a short-lived token', async ({
    apiClients,
    baseUrl,
    expect,
  }) => {
    const { id, secret } = await apiClients.register();

    const { data } = await api.authenticateApiClient({
      body: { client_id: id, client_secret: secret, grant_type: 'client_credentials' },
      client: makeHttpClient(baseUrl),
    });

    expect(data).toEqual({ access_token: expect.any(String), expires_in: 900, token_type: 'Bearer' });
  });

  test('should answer as OAuth does to a wrong secret', async ({ apiClients, baseUrl, expect }) => {
    const { id } = await apiClients.register();

    const { error, response } = await api.authenticateApiClient({
      body: { client_id: id, client_secret: 'wrong', grant_type: 'client_credentials' },
      client: makeHttpClient(baseUrl),
    });

    expect({ error: error?.error, status: response?.status }).toEqual({ error: 'invalid_client', status: 401 });
  });

  // The guard of the API clients is tested here once, on one of the routes it protects
  test.describe('guard', () => {
    const statusOf = (client: Client): Promise<number | undefined> =>
      magistrats
        .identifyMagistrat({ body: { email: 'etienne.trevoux@justice.fr' }, client })
        .then(({ response }) => response?.status);

    test('should refuse a call without token', async ({ baseUrl, expect }) => {
      expect(await statusOf(makeHttpClient(baseUrl))).toBe(401);
    });

    test('should refuse the token of a client revoked since', async ({ apiClients, expect, sql }) => {
      const revoked = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
      await sql`update identity_and_access_context.api_clients set revoked_at = now() where id = ${revoked.id}`;

      expect(await statusOf(revoked.http)).toBe(401);
    });

    test('should refuse a token used from an IP the client is not allowed', async ({ apiClients, expect, sql }) => {
      // the token was issued from an allowed IP, which is then taken away from the client
      const moved = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
      await sql`delete from identity_and_access_context.api_client_allowed_ips where client_id = ${moved.id}`;

      expect(await statusOf(moved.http)).toBe(403);
    });

    test('should refuse a route out of the scopes of the client', async ({ apiClients, expect }) => {
      const outOfScope = await apiClients.authenticated({ scopes: ['magistrats:status'] });

      expect(await statusOf(outOfScope.http)).toBe(403);
    });
  });
});
