import * as assert from 'node:assert/strict';
import { File } from 'node:buffer';
import * as crypto from 'node:crypto';

import { generateLolfiArchive, type LolfiData } from 'lolfi';

import { test } from '../fixtures.ts';
import type { TestStepsAdmin } from '../steps.ts';
import * as seed from '../utils/seed.ts';
import { waitFor } from '../utils/wait-for.ts';

test.describe('lolfi', () => {
  test('should import a session from lolfi', async ({ sessions, expect }) => {
    const session = await sessions.createOne({
      name: 'Transparence annuelle',
      createdAt: '22/04/2026',
      candidates: [
        {
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  LYON'],
            function: seed.functions.PR,
          },
          targetPosition: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            function: seed.functions.PR,
          },
        },
      ],
    });

    expect(session).toEqual({ id: expect.any(String) });
  });

  test('should define a PROFILE priority', async ({ sessions, agent, expect }) => {
    const session = await sessions.createOne({
      name: `Transparence annuelle (${crypto.randomUUID()})`,
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  LYON'],
            function: seed.functions.PR,
          },
          targetPosition: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            profile: 'profil assise',
            profileId: null,
            function: seed.functions.PR,
          },
        },
      ],
    });

    const sessionFiles = await agent.sessions.listNominationFiles({
      path: { sessionId: session.id },
    });
    expect(sessionFiles.data!.items[0]!.priorities).toEqual(['PROFILE']);
  });

  test('should update an existing session', async ({ sessions, agent, expect }) => {
    const initialSession: LolfiData['sessions'][number] = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  LYON'],
            function: seed.functions.PR,
          },
          targetPosition: {
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            function: seed.functions.PR,
          },
        },
      ],
    };

    const nextSession: LolfiData['sessions'][number] = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '23/04/2026',
      candidates: [
        {
          firstName: 'MICHEL',
          lastName: 'BERGER',
          position: {
            function: seed.functions.P,
            jurisdiction: seed.jurisdictions['CA  LYON'],
          },
          targetPosition: {
            function: seed.functions.P,
            jurisdiction: seed.jurisdictions['TPR  CANNES'],
          },
        },
      ],
    };

    const initial = await sessions.createOne(initialSession);

    // Re-ingesting the same session alongside a new one must update it, not duplicate it
    const [, next] = await sessions.createMany([initialSession, nextSession]);

    const initialFiles = await agent.sessions.listNominationFiles({
      path: { sessionId: initial.id },
    });
    expect(initialFiles.data!.totalCount).toBe(1);

    const nextFiles = await agent.sessions.listNominationFiles({ path: { sessionId: next!.id } });
    expect(nextFiles.data!.totalCount).toBe(1);
  });

  test('should accept the next archive after a failed ingestion', async ({ admin, expect }) => {
    const candidate = {
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      position: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  LYON'],
        function: seed.functions.PR,
      },
      targetPosition: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
        function: seed.functions.PR,
      },
    } satisfies LolfiData['sessions'][number]['candidates'][number];

    const candidateWithoutLastName = { ...candidate, lastName: '' };

    const rejectedJobId = await ingestArchive(admin, {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '22/04/2026',
      candidates: [candidateWithoutLastName],
    });

    expect(await waitForEndedJob(admin, rejectedJobId)).toBe('FAILED');

    const nextJobId = await ingestArchive(admin, {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '23/04/2026',
      candidates: [candidate],
    });

    expect(await waitForEndedJob(admin, nextJobId)).toBe('SUCCEEDED');
  });
});

async function ingestArchive(admin: TestStepsAdmin, session: LolfiData['sessions'][number]): Promise<number> {
  const archive = await generateLolfiArchive({ sessions: [session] });
  const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, {
    type: 'application/zip',
  });

  const { data } = await admin.ingest.ingestLolfiArchive({ body: { file }, throwOnError: true });

  return data!.id;
}

function waitForEndedJob(admin: TestStepsAdmin, jobId: number): Promise<'FAILED' | 'SUCCEEDED'> {
  return waitFor(
    async () => {
      const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });
      const status = data!.status;

      assert.ok(status === 'FAILED' || status === 'SUCCEEDED', `job #${jobId} is still ${status}`);

      return status;
    },
    { timeout: 5_000 },
  );
}
