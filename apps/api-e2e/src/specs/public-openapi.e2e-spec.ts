import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { test } from '../fixtures.ts';

test.describe('Public OpenAPI E2E', () => {
  // The API clients hold a copy of this file: a change here is a change of contract to hand over again. To update it,
  // save `/openapi/public.json` from a local API over it, then format it
  test('serves the document committed in docs/public-api.openapi.json', async ({ baseUrl, expect }) => {
    const served = await fetch(`${baseUrl}/openapi/public.json`).then((response) => response.json());
    const committed = await readFile(join(import.meta.dirname, '../../../../docs/public-api.openapi.json'), 'utf8');

    expect(served).toEqual(JSON.parse(committed));
  });
});
