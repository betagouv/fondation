import * as crypto from 'node:crypto';

import type { Sql } from 'postgres';

import { type Client, createClient, createConfig } from '../generated/api/client/index.ts';
import { apiClients } from '../generated/api/sdk.ts';

type ApiClientOptions = {
  allowedIps?: string[];
  /** the calls a minute allowed on each scope, far above what a test makes by default */
  limitPerMinute?: number;
  scopes?: string[];
};

/** registers an API client as the command line does, the API serving no route for it */
export interface ApiClientFixture {
  register(options?: ApiClientOptions): Promise<{ id: string; secret: string }>;
  /** a newly registered API client, with an http client holding its fresh token */
  authenticated(options?: ApiClientOptions): Promise<{ http: Client; id: string }>;
}

// the tests reach the API through the loopback, in IPv4 or IPv6
const LOOPBACK_IPS = ['127.0.0.1', '::1'];

export function makeApiClientFixture({ baseUrl, sql }: { baseUrl: string; sql: Sql }): ApiClientFixture {
  async function register({ allowedIps = LOOPBACK_IPS, limitPerMinute = 1_000, scopes = [] }: ApiClientOptions = {}) {
    const id = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('base64url');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    await sql`
      insert into identity_and_access_context.api_clients (id, name, secret_hash)
      values (${id}, ${`e2e ${id}`}, ${secretHash})
    `;
    for (const ip of allowedIps) {
      await sql`insert into identity_and_access_context.api_client_allowed_ips (client_id, ip) values (${id}, ${ip})`;
    }
    for (const scope of scopes) {
      await sql`
        insert into identity_and_access_context.api_client_scopes (client_id, limit_per_minute, scope)
        values (${id}, ${limitPerMinute}, ${scope})
      `;
    }

    return { id, secret };
  }

  async function authenticated(options?: ApiClientOptions): Promise<{ http: Client; id: string }> {
    const { id, secret } = await register(options);
    const { data } = await apiClients.authenticateApiClient({
      body: { client_id: id, client_secret: secret, grant_type: 'client_credentials' },
      client: createClient(createConfig({ baseUrl })),
      throwOnError: true,
    });

    return {
      http: createClient(createConfig({ baseUrl, headers: { Authorization: `Bearer ${data.access_token}` } })),
      id,
    };
  }

  return { authenticated, register };
}
