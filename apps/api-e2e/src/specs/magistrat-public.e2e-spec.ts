import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import { magistrats } from '../generated/api/sdk.ts';
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
    // never cached: the answer follows the last extraction
    expect({ cache: response?.headers.get('cache-control'), data, status: response?.status }).toEqual({
      cache: 'no-store',
      data: { magistrat: { id: magistrat!.id }, status: 'ACTIVE' },
      status: 200,
    });
  });

  test('should not identify an address held by two active magistrats', async ({ apiClients, expect, lolfi }) => {
    const email = randomEmail();
    const job = await lolfi.ingest([
      { createdAt: '22/04/2026', candidates: [candidate('ETIENNE', email), candidate('MICHEL', email)] },
    ]);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    const { data } = await magistrats.identifyMagistrat({ body: { email }, client: site.http });

    expect({ data, import: job.status }).toEqual({ data: { status: 'UNKNOWN' }, import: 'SUCCEEDED' });
  });

  test('should no longer identify a magistrat that left the extraction', async ({ apiClients, expect, lolfi }) => {
    const staying = candidate('ETIENNE', randomEmail());
    const leaving = candidate('MICHEL', randomEmail());
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    const identify = () =>
      magistrats
        .identifyMagistrat({ body: { email: leaving.email! }, client: site.http, throwOnError: true })
        .then(({ data }) => data.status);

    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying, leaving] }]);
    const before = await identify();
    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying] }]);

    expect({ after: await identify(), before }).toEqual({ after: 'UNKNOWN', before: 'ACTIVE' });
  });

  test('should read again the status of an identified magistrat, until it leaves the extraction', async ({
    apiClients,
    expect,
    lolfi,
  }) => {
    const staying = candidate('ETIENNE', randomEmail());
    const leaving = candidate('MICHEL', randomEmail());
    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying, leaving] }]);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification', 'magistrats:status'] });
    const identified = await magistrats.identifyMagistrat({
      body: { email: leaving.email! },
      client: site.http,
      throwOnError: true,
    });
    assert.equal(identified.data.status, 'ACTIVE');
    const magistratId = identified.data.magistrat.id;
    const readStatus = () =>
      magistrats.findMagistratStatus({ client: site.http, path: { magistratId }, throwOnError: true });

    const before = await readStatus();
    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying] }]);
    const after = await readStatus();

    expect({
      after: after.data,
      before: before.data,
      cache: after.response.headers.get('cache-control'),
    }).toEqual({ after: { status: 'INACTIVE' }, before: { status: 'ACTIVE' }, cache: 'private, max-age=86400' });
  });

  test('should tell an unknown identifier without letting the answer be cached', async ({ apiClients, expect }) => {
    const site = await apiClients.authenticated({ scopes: ['magistrats:status'] });

    const { response } = await magistrats.findMagistratStatus({
      client: site.http,
      path: { magistratId: crypto.randomUUID() },
    });

    expect({ cache: response?.headers.get('cache-control'), status: response?.status }).toEqual({
      cache: 'no-store',
      status: 404,
    });
  });

  test('should take the address letter for letter', async ({ apiClients, expect, lolfi }) => {
    const id = crypto.randomUUID();
    const job = await lolfi.ingest([
      { createdAt: '22/04/2026', candidates: [candidate('ETIENNE', `etienne.trevoux-${id}@justice.fr`)] },
    ]);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    // an underscore stands for any character in a pattern, not in an address
    const { data } = await magistrats.identifyMagistrat({
      body: { email: `etienne_trevoux-${id}@justice.fr` },
      client: site.http,
    });

    expect({ data, import: job.status }).toEqual({ data: { status: 'UNKNOWN' }, import: 'SUCCEEDED' });
  });

  test('should refuse an address longer than an email can be', async ({ apiClients, expect }) => {
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    const { error, response } = await magistrats.identifyMagistrat({
      body: { email: `${'a'.repeat(64)}@${'b'.repeat(187)}.fr` },
      client: site.http,
    });

    expect({ error, status: response?.status }).toEqual({
      error: expect.objectContaining({ errors: [expect.objectContaining({ code: 'too_big' })] }),
      status: 400,
    });
  });

  test('should refuse the calls of an API client beyond its limit of the minute', async ({ apiClients, expect }) => {
    const site = await apiClients.authenticated({ limitPerMinute: 1, scopes: ['magistrats:identification'] });
    const identify = () => magistrats.identifyMagistrat({ body: { email: randomEmail() }, client: site.http });

    await identify();
    // wherever the minute changes, the second or the third call is the second of its minute
    const refused = [await identify(), await identify()].find(({ response }) => response?.status === 429);

    const retryAfter = Number(refused?.response?.headers.get('retry-after'));
    expect(retryAfter >= 1 && retryAfter <= 60).toBe(true);
  });
});
