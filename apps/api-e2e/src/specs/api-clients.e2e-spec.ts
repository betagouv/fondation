import * as assert from 'node:assert/strict';

import { test } from '../fixtures.ts';
import type { ApiClientFixture } from '../fixtures/api-client.fixture.ts';
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

    // twice the limit and one more: wherever the minute changes, one of its sides holds more than the limit
    const statusesOfRefusedCalls = async (client: Client): Promise<(number | undefined)[]> => {
      const statuses: (number | undefined)[] = [];
      for (let call = 0; call < 21; call++) statuses.push(await statusOf(client));

      return statuses;
    };

    test('should turn away an IP that no client is allowed, whose calls were refused too often within the minute', async ({
      baseUrl,
      expect,
      sql,
    }) => {
      // the proxy of Scalingo is trusted: the API takes the IP it forwards
      const ip = '198.51.100.9';
      const stranger = makeHttpClient(baseUrl);
      stranger.setConfig({ headers: { 'X-Forwarded-For': ip } });
      await sql`delete from identity_and_access_context.api_rate_counters where caller = ${`ip:${ip}`}`;

      const statuses = await statusesOfRefusedCalls(stranger);

      expect({ first: statuses[0], turnedAway: statuses.includes(429) }).toEqual({ first: 401, turnedAway: true });
    });

    test('should never turn away the IP of a client, which gets refused when its token expires', async ({
      apiClients,
      baseUrl,
      expect,
    }) => {
      await apiClients.register();

      const statuses = await statusesOfRefusedCalls(makeHttpClient(baseUrl));

      expect(new Set(statuses)).toEqual(new Set([401]));
    });
  });

  test(
    'should give a token for the new secret and for the replaced one while a rotation lasts',
    // a command starts the application, which takes most of the default five seconds
    { timeout: 20_000 },
    async ({ apiClients, baseUrl, expect }) => {
      const { id, secret: replaced } = await apiClients.register();

      const renewed = await rotateSecret(apiClients, id);

      expect({
        renewed: await tokenStatus(baseUrl, id, renewed),
        replaced: await tokenStatus(baseUrl, id, replaced),
      }).toEqual({ renewed: 200, replaced: 200 });
    },
  );

  test(
    'should refuse the replaced secret and the tokens already given once the rotation is ended',
    { timeout: 20_000 },
    async ({ apiClients, baseUrl, expect }) => {
      const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
      const renewed = await rotateSecret(apiClients, site.id);

      await apiClients.command('end-rotation', '--client', site.id);

      const { response } = await magistrats.identifyMagistrat({
        body: { email: 'etienne.trevoux@justice.fr' },
        client: site.http,
      });
      expect({
        renewed: await tokenStatus(baseUrl, site.id, renewed),
        replaced: await tokenStatus(baseUrl, site.id, site.secret),
        token: response?.status,
      }).toEqual({ renewed: 200, replaced: 401, token: 401 });
    },
  );
});

/** @returns the new secret, as the operator reads it once in the output of the command */
async function rotateSecret(apiClients: ApiClientFixture, clientId: string): Promise<string> {
  const output = await apiClients.command('rotate-secret', '--client', clientId);
  const secret = /^client_secret: (\S+)$/m.exec(output)?.[1];
  assert.ok(secret, `no secret in the output of rotate-secret: ${output}`);

  return secret;
}

function tokenStatus(baseUrl: string, clientId: string, secret: string): Promise<number | undefined> {
  return api
    .authenticateApiClient({
      body: { client_id: clientId, client_secret: secret, grant_type: 'client_credentials' },
      client: makeHttpClient(baseUrl),
    })
    .then(({ response }) => response?.status);
}
