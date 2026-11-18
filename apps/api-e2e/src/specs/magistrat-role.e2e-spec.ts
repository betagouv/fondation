import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import { createClient, createConfig } from '../generated/api/client/index.ts';
import { magistrats } from '../generated/api/sdk.ts';
import { machineToken } from '../utils/e2e-tokens.ts';
import * as seed from '../utils/seed.ts';

test.describe('magistrat role', () => {
  test('should recognise a magistrat only while active', async ({ baseUrl, expect, lolfi }) => {
    const machine = createClient(createConfig({ baseUrl, headers: { Authorization: `Bearer ${machineToken}` } }));
    const roleOf = (email: string): Promise<string> =>
      magistrats
        .searchMagistratAuthorization({ body: { email }, client: machine, throwOnError: true })
        .then(({ data }) => data.role);

    const position = {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  LYON'],
      function: seed.functions.PR,
    } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number]['position'];
    const targetPosition = { ...position, jurisdiction: seed.jurisdictions['CA  GRENOBLE'] };
    const staying = {
      id: crypto.randomInt(1_000, 9_999),
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      email: `${crypto.randomUUID()}@justice.fr`,
      position,
      targetPosition,
    };
    const leaving = {
      id: crypto.randomInt(10_000, 19_999),
      firstName: 'MICHEL',
      lastName: 'BERGER',
      email: `${crypto.randomUUID()}@justice.fr`,
      position,
      targetPosition,
    };

    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying, leaving] }]);
    // absent from the last import, a magistrat becomes inactive
    await lolfi.ingest([{ createdAt: '22/04/2026', candidates: [staying] }]);

    expect({ leaving: await roleOf(leaving.email), staying: await roleOf(staying.email.toUpperCase()) }).toEqual({
      leaving: 'UNKNOWN',
      staying: 'MAGISTRAT',
    });
  });
});
