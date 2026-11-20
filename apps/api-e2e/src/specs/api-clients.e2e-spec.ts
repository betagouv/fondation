import { test } from '../fixtures.ts';
import { apiClients as api } from '../generated/api/sdk.ts';
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
});
