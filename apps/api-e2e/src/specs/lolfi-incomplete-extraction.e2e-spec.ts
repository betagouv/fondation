import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

import { generateLolfiArchive, type LolfiArchiveContent } from 'lolfi';
import { inject } from 'vitest';

import { test } from '../fixtures.ts';
import type { LolfiFixture } from '../fixtures/lolfi.fixture.ts';
import type { DetailedJobDto } from '../generated/api/types.ts';
import type { TestStepsAdmin } from '../steps.ts';
import { startApi } from '../utils/api.ts';
import * as seed from '../utils/seed.ts';

// The shared api never holds an extraction (.env.e2e): each import there drops the magistrats of the tests before
// oxlint-disable-next-line no-empty-pattern -- vitest reads the dependencies of a fixture from this pattern
test.override('baseUrl', async ({}, { onCleanup }) => {
  const [apiUrl, stop] = await startApi(inject('tchapUrl'), { LOLFI_MAX_DEACTIVATION_RATIO: '0.5' });
  onCleanup(stop);

  return apiUrl;
});

test(
  'should hold the departures of an incomplete extraction and read it again',
  { timeout: 40_000 },
  async ({ admin, expect, lolfi, sql }) => {
    // the tests before left active magistrats that none of these archives holds
    await sql`update data_administration_context.magistrat set status = 'INACTIVE'`;

    const lastName = randomLastName();
    const [etienne, michel, france, jean] = ['ETIENNE', 'MICHEL', 'FRANCE', 'JEAN'].map((firstName) =>
      magistrat(firstName, lastName),
    );

    await sendUntilEnded(lolfi, await archiveOf([etienne!, michel!, france!, jean!]));
    // one departure out of four is under the threshold
    await sendUntilEnded(lolfi, await archiveOf([etienne!, michel!, france!]));
    expect(await statusesOf(admin, lastName)).toEqual({
      ETIENNE: 'ACTIVE',
      MICHEL: 'ACTIVE',
      FRANCE: 'ACTIVE',
      JEAN: 'INACTIVE',
    });

    const truncated = await archiveOf([jean!]);
    const heldJobId = await sendUntilEnded(lolfi, truncated);

    expect(await statusesOf(admin, lastName)).toEqual({
      ETIENNE: 'ACTIVE',
      MICHEL: 'ACTIVE',
      FRANCE: 'ACTIVE',
      JEAN: 'ACTIVE',
    });
    const held = await magistratsFile(admin, heldJobId);
    expect(held.status).toBe('FAILED');
    expect(held.messages.map(({ text }) => text)).toEqual([
      expect.stringContaining('3 des 3 magistrats actifs sont absents'),
    ]);

    const readAgainJobId = await sendUntilEnded(lolfi, truncated);

    const readAgain = await magistratsFile(admin, readAgainJobId);
    expect(readAgain.fileSha256).toBe(held.fileSha256);
    expect(readAgain.status).toBe('FAILED');
    expect(await extractionAlertsOf([heldJobId, readAgainJobId])).toHaveLength(2);
  },
);

function randomLastName(): string {
  return Array.from({ length: 12 }, () => String.fromCharCode(97 + crypto.randomInt(26))).join('');
}

function magistrat(firstName: string, lastName: string): LolfiArchiveContent['sessions'][number]['candidates'][number] {
  return {
    id: crypto.randomInt(20_000, 900_000),
    firstName,
    lastName,
    position: { grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'], function: seed.functions.PR },
    targetPosition: { grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'], function: seed.functions.PR },
  };
}

function archiveOf(candidates: LolfiArchiveContent['sessions'][number]['candidates']): Promise<ArrayBuffer> {
  return generateLolfiArchive({ sessions: [{ createdAt: '22/04/2026', candidates }] });
}

async function sendUntilEnded(lolfi: LolfiFixture, archive: ArrayBuffer): Promise<number> {
  const job = await lolfi.send(archive);
  assert.equal(job.status, 'SUCCEEDED', `job #${job.id} did not succeed`);

  return job.id;
}

async function statusesOf(admin: TestStepsAdmin, lastName: string): Promise<Record<string, string>> {
  const { data } = await admin.magistrats.searchMagistrats({ query: { search: lastName }, throwOnError: true });

  return Object.fromEntries(data!.items.map(({ firstName, status }) => [firstName, status]));
}

async function magistratsFile(admin: TestStepsAdmin, jobId: number): Promise<DetailedJobDto['files'][number]> {
  const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });
  const file = data!.files.find(({ name }) => name === 'MAGISTRATS.xml');

  assert.ok(file, `job #${jobId} has no MAGISTRATS.xml`);

  return file;
}

async function extractionAlertsOf(jobIds: number[]): Promise<string[]> {
  const alerts = (await fetch(inject('tchapUrl')).then((response) => response.json())) as { body: string }[];

  return alerts
    .map(({ body }) => body)
    .filter(
      (body) =>
        body.startsWith('🚨 Extraction LOLFI incomplète') &&
        jobIds.some((jobId) => body.endsWith(`/admin/ingestions/${jobId}`)),
    );
}
