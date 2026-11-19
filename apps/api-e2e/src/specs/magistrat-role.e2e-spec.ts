import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import { createClient, createConfig } from '../generated/api/client/index.ts';
import { magistrats } from '../generated/api/sdk.ts';
import { machineToken } from '../utils/e2e-tokens.ts';
import * as seed from '../utils/seed.ts';

type Candidate = LolfiArchiveContent['sessions'][number]['candidates'][number];

function candidate(firstName: string, email: string): Candidate {
  return {
    email,
    firstName,
    lastName: 'TREVOUX',
    position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
    targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'] },
  };
}

// TODO: see lolfi.fixture.ts, which builds the same machine client
function roleReader(baseUrl: string): (email: string) => Promise<string> {
  const machine = createClient(createConfig({ baseUrl, headers: { Authorization: `Bearer ${machineToken}` } }));

  return (email) =>
    magistrats
      .searchMagistratAuthorization({ body: { email }, client: machine, throwOnError: true })
      .then(({ data }) => data.role);
}

test.describe('magistrat role', () => {
  test('should recognise a magistrat only while active', async ({ baseUrl, expect, lolfi }) => {
    const roleOf = roleReader(baseUrl);
    const staying = candidate('ETIENNE', `${crypto.randomUUID()}@justice.fr`);
    const leaving = candidate('MICHEL', `${crypto.randomUUID()}@justice.fr`);

    const first = await lolfi.ingest([{ candidates: [staying, leaving], createdAt: '22/04/2026' }]);
    const before = await roleOf(leaving.email!);
    // absent from the last import, a magistrat becomes inactive
    const second = await lolfi.ingest([{ candidates: [staying], createdAt: '22/04/2026' }]);

    expect({
      imports: [first.status, second.status],
      leaving: { after: await roleOf(leaving.email!), before },
      staying: await roleOf(staying.email!),
    }).toEqual({
      imports: ['SUCCEEDED', 'SUCCEEDED'],
      leaving: { after: 'UNKNOWN', before: 'MAGISTRAT' },
      staying: 'MAGISTRAT',
    });
  });

  test('should take the address letter for letter, whatever the case', async ({ baseUrl, expect, lolfi }) => {
    const roleOf = roleReader(baseUrl);
    const id = crypto.randomUUID();
    await lolfi.ingest([
      { candidates: [candidate('ETIENNE', `etienne.trevoux-${id}@justice.fr`)], createdAt: '22/04/2026' },
    ]);

    expect({
      // an underscore stands for any character in a pattern, not in an address
      lookalike: await roleOf(`etienne_trevoux-${id}@justice.fr`),
      uppercase: await roleOf(`ETIENNE.TREVOUX-${id}@JUSTICE.FR`),
    }).toEqual({ lookalike: 'UNKNOWN', uppercase: 'MAGISTRAT' });
  });
});
