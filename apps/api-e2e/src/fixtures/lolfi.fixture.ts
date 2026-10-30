import * as assert from 'node:assert/strict';
import { File } from 'node:buffer';

import { generateLolfiArchive, type LolfiArchiveContent } from 'lolfi';

import { createClient, createConfig } from '../generated/api/client/index.ts';
import { ingest } from '../generated/api/sdk.ts';
import type { TestStepsAdmin } from '../steps.ts';
import { machineToken } from '../utils/e2e-tokens.ts';
import { waitFor } from '../utils/wait-for.ts';

type EndedJob = { id: number; status: 'FAILED' | 'SUCCEEDED' };

/** sends an archive as lolfi does, then waits for its job to end */
export interface LolfiFixture {
  ingest(sessions: LolfiArchiveContent['sessions'], options?: { as: 'ADMIN' | 'MACHINE' }): Promise<EndedJob>;
}

export function makeLolfiFixture({ admin, baseUrl }: { admin: TestStepsAdmin; baseUrl: string }): LolfiFixture {
  const machine = createClient(createConfig({ baseUrl, headers: { Authorization: `Bearer ${machineToken}` } }));

  async function ingestArchive(
    sessions: LolfiArchiveContent['sessions'],
    options: { as: 'ADMIN' | 'MACHINE' } = { as: 'ADMIN' },
  ): Promise<EndedJob> {
    const archive = await generateLolfiArchive({ sessions });
    const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, { type: 'application/zip' });
    const client = options.as === 'MACHINE' ? machine : admin['@client'];
    const { id } = await ingest
      .ingestLolfiArchive({ body: { file }, client, throwOnError: true })
      .then(({ data }) => data);

    const status = await waitFor(async () => {
      const { status } = await admin.jobs
        .detailsJob({ path: { jobId: id }, throwOnError: true })
        .then(({ data }) => data);
      assert.ok(status === 'FAILED' || status === 'SUCCEEDED', `job #${id} is still ${status}`);

      return status;
    });

    return { id, status };
  }

  return { ingest: ingestArchive };
}
