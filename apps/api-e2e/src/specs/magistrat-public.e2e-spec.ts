import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import { magistrats } from '../generated/api/sdk.ts';
import { makeHttpClient } from '../steps.ts';
import * as seed from '../utils/seed.ts';

type Candidate = LolfiArchiveContent['sessions'][number]['candidates'][number];

function candidate(firstName: string, email: string): Candidate {
  return {
    id: crypto.randomInt(1_000, 900_000),
    firstName,
    lastName: 'TREVOUX',
    email,
    position: { grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'], function: seed.functions.PR },
    targetPosition: { grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'], function: seed.functions.PR },
  };
}

function randomEmail(): string {
  return `${crypto.randomUUID()}@justice.fr`;
}

test.describe('public magistrat routes', () => {
  test('should identify an active magistrat by its professional email, whatever the case', async ({
    apiClients,
    expect,
    lolfi,
    sql,
  }) => {
    const email = randomEmail();
    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [candidate('ETIENNE', email)] }]);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    const { data, response } = await magistrats.identifyMagistrat({
      body: { email: email.toUpperCase() },
      client: site.http,
    });

    const [magistrat] = await sql<{ id: string }[]>`
      select id from data_administration_context.magistrat where professional_email = ${email}
    `;
    // always 200, as the contract with the website says, and never cached
    expect({ cache: response?.headers.get('cache-control'), data, status: response?.status }).toEqual({
      cache: 'no-store',
      data: { magistrat: { id: magistrat!.id }, status: 'ACTIVE' },
      status: 200,
    });
  });

  test('should not identify an address held by two active magistrats', async ({ apiClients, expect, lolfi }) => {
    const email = randomEmail();
    await lolfi.ingest([
      { createdAt: '22/04/2026', candidates: [candidate('ETIENNE', email), candidate('MICHEL', email)] },
    ]);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    const { data } = await magistrats.identifyMagistrat({ body: { email }, client: site.http });

    expect(data).toEqual({ status: 'UNKNOWN' });
  });

  test('should let API clients in by their token, their IP and their scope only', async ({
    apiClients,
    baseUrl,
    expect,
    sql,
  }) => {
    const identify = (client: ReturnType<typeof makeHttpClient>): Promise<number | undefined> =>
      magistrats.identifyMagistrat({ body: { email: randomEmail() }, client }).then(({ response }) => response?.status);

    const outOfScope = await apiClients.authenticated({ scopes: ['magistrats:status'] });
    // its token was issued from an allowed IP, which is then taken away from the client
    const moved = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await sql`delete from identity_and_access_context.api_client_allowed_ips where client_id = ${moved.id}`;
    const revoked = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await sql`update identity_and_access_context.api_clients set revoked_at = now() where id = ${revoked.id}`;

    expect({
      fromAnotherIp: await identify(moved.http),
      outOfScope: await identify(outOfScope.http),
      revoked: await identify(revoked.http),
      withoutToken: await identify(makeHttpClient(baseUrl)),
    }).toEqual({ fromAnotherIp: 403, outOfScope: 403, revoked: 401, withoutToken: 401 });
  });
});
