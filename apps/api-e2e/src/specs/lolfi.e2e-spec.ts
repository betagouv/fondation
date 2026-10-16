import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';
import postgres from 'postgres';
import { inject } from 'vitest';

import { test } from '../fixtures.ts';
import type { LolfiFixture } from '../fixtures/lolfi.fixture.ts';
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

    expect(session).toEqual({
      files: [{ id: expect.any(String), magistratId: expect.any(String) }],
      id: expect.any(String),
      name: expect.stringMatching(/^Transparence annuelle \(\d+\)$/),
    });
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
    const initialSession: LolfiArchiveContent['sessions'][number] = {
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

    const nextSession: LolfiArchiveContent['sessions'][number] = {
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
            jurisdiction: seed.jurisdictions['TPR CANNES'],
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

  test('should keep ingesting a formation once the other one was deleted', async ({ agent, expect, lolfi }) => {
    const lolfiSessionId = crypto.randomInt(1_000, 900_000);
    const name = crypto.randomUUID();

    const siegeCandidate = {
      id: crypto.randomInt(1_000, 9_999),
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      position: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  LYON'],
        function: seed.functions.P,
      },
      targetPosition: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
        function: seed.functions.P,
      },
    } as const satisfies LolfiArchiveContent['sessions'][number]['candidates'][number];

    const parquetCandidate = {
      id: crypto.randomInt(1_000, 9_999),
      firstName: 'MICHEL',
      lastName: 'BERGER',
      position: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  LYON'],
        function: seed.functions.PR,
      },
      targetPosition: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  MONTPELLIER'],
        function: seed.functions.PR,
      },
    } as const satisfies LolfiArchiveContent['sessions'][number]['candidates'][number];

    const lateParquetCandidate = {
      ...parquetCandidate,
      id: crypto.randomInt(1_000, 9_999),
      firstName: 'FRANCE',
      lastName: 'GALL',
    };

    const findSession = async (formation: 'SIEGE' | 'PARQUET'): Promise<{ id: string } | undefined> => {
      const { data } = await agent.sessions.listSessionsOfTypeGardeDesSceaux({
        query: { search: `${name} (${lolfiSessionId})`, formations: [formation] },
      });

      return data!.items[0];
    };

    // one lolfi session for both formations, which the session fixture does not handle
    await ingestUntilEnded(lolfi, {
      id: lolfiSessionId,
      name,
      createdAt: '22/04/2026',
      candidates: [siegeCandidate, parquetCandidate],
    });

    // the sessions are synchronised once the job succeeded
    const [siege, parquet] = await waitFor(async () => {
      const found = [await findSession('SIEGE'), await findSession('PARQUET')] as const;
      assert.ok(found[0], 'siege session is undefined');
      assert.ok(found[1], 'parquet session is undefined');

      return [found[0], found[1]] as const;
    });

    await agent.sessions.deleteNominationSession({ path: { sessionId: siege.id }, throwOnError: true });

    await ingestUntilEnded(lolfi, {
      id: lolfiSessionId,
      name,
      createdAt: '22/04/2026',
      candidates: [siegeCandidate, parquetCandidate, lateParquetCandidate],
    });

    await waitFor(async () => {
      const parquetFiles = await agent.sessions.listNominationFiles({ path: { sessionId: parquet.id } });
      assert.equal(parquetFiles.data!.totalCount, 2, 'the parquet session was not ingested again');
    });

    expect(await findSession('SIEGE')).toBeUndefined();
  });

  test('should accept an archive sent with a machine token', async ({ lolfi, expect }) => {
    const job = await lolfi.ingest(
      [
        {
          id: crypto.randomInt(1_000, 900_000),
          name: crypto.randomUUID(),
          createdAt: publishedToday(),
          candidates: [trevoux()],
        },
      ],
      { as: 'MACHINE' },
    );

    expect(job.status).toBe('SUCCEEDED');
  });

  test('should accept the next archive after a failed ingestion', async ({ expect, lolfi }) => {
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
    } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number];

    const candidateWithoutLastName = { ...candidate, lastName: '' };

    const rejectedJob = await lolfi.ingest([
      {
        id: crypto.randomInt(1_000, 900_000),
        name: crypto.randomUUID(),
        createdAt: '22/04/2026',
        candidates: [candidateWithoutLastName],
      },
    ]);

    expect(rejectedJob.status).toBe('FAILED');

    const nextJob = await lolfi.ingest([
      {
        id: crypto.randomInt(1_000, 900_000),
        name: crypto.randomUUID(),
        createdAt: '23/04/2026',
        candidates: [candidate],
      },
    ]);

    expect(nextJob.status).toBe('SUCCEEDED');
  });

  test('should attach new files when the sessions file did not change', async ({ admin, expect, lolfi }) => {
    const position = {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  LYON'],
      function: seed.functions.PR,
    } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number]['position'];

    const targetPosition = {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      function: seed.functions.PR,
    } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number]['targetPosition'];

    const etienne = {
      id: crypto.randomInt(1_000, 9_999),
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      position,
      targetPosition,
    };
    const michel = {
      id: crypto.randomInt(10_000, 19_999),
      firstName: 'MICHEL',
      lastName: 'BERGER',
      position,
      targetPosition,
    };

    const unchangedSession = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '22/04/2026',
    };

    const firstJob = await lolfi.ingest([{ ...unchangedSession, candidates: [etienne] }]);
    expect(firstJob.status).toBe('SUCCEEDED');

    const secondJob = await lolfi.ingest([
      {
        ...unchangedSession,
        candidates: [etienne, michel],
      },
    ]);
    expect(secondJob.status).toBe('SUCCEEDED');

    expect(await sessionsFileDigest(admin, secondJob.id)).toBe(await sessionsFileDigest(admin, firstJob.id));

    const sessionId = await findSessionId(admin, `${unchangedSession.name} (${unchangedSession.id})`);

    const totalCount = await waitFor(async () => {
      const files = await admin.sessions.listNominationFiles({ path: { sessionId } });
      assert.equal(files.data!.totalCount, 2);

      return files.data!.totalCount;
    });

    expect(totalCount).toBe(2);
  });

  test('should report a transparence received without a single proposition', async ({ admin, expect, lolfi }) => {
    const withoutProposition = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '04/09/2026',
      candidates: [{ ...trevoux(), designated: false }],
    };

    const nominal = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '04/09/2026',
      candidates: [berger()],
    };

    const job = await lolfi.ingest([withoutProposition, nominal]);
    expect(job.status).toBe('SUCCEEDED');

    const reported = await waitFor(async () => {
      const errors = await jobErrors(admin, job.id);
      const reported = errors.find(mentioning(withoutProposition.id));

      assert.ok(reported, `transparence ${withoutProposition.id} not reported on job #${job.id}`);
      assert.ok(
        !errors.some(mentioning(nominal.id)),
        `transparence ${nominal.id} produced a session and must not be reported`,
      );

      return reported;
    });

    expect(reported).toContain('1 candidature et aucune proposition, aucune session créée');

    const alerts = await waitFor(async () => {
      const alerts = await findAlerts(withoutProposition.id);
      assert.equal(alerts.length, 1, `expected one alert, got ${alerts.length}`);

      return alerts;
    });

    expect(alerts[0]!.title).toBe('🚨 Transparence LOLFI incomplète');
    expect(alerts[0]!.text).toContain('aucune proposition');
  });

  test(
    'should alert once for a transparence that stays broken, and again when it changes',
    { timeout: 20_000 },
    async ({ admin, expect, lolfi }) => {
      const broken = {
        id: crypto.randomInt(1_000, 900_000),
        name: crypto.randomUUID(),
        createdAt: '04/09/2026',
        candidates: [{ ...trevoux(), designated: false }],
      };

      const firstJob = await lolfi.ingest([broken]);
      expect(firstJob.status).toBe('SUCCEEDED');
      await waitFor(async () => {
        assert.equal((await findAlerts(broken.id)).length, 1, `the first import must alert`);
      });

      const secondJob = await lolfi.ingest([broken]);
      expect(secondJob.status).toBe('SUCCEEDED');
      await waitFor(async () => {
        const errors = await jobErrors(admin, secondJob.id);
        assert.ok(
          errors.some(mentioning(broken.id)),
          `transparence ${broken.id} must stay reported on job #${secondJob.id}`,
        );
      });
      expect(await findAlerts(broken.id)).toHaveLength(1);

      const worse = { ...broken, candidates: [...broken.candidates, { ...berger(), designated: false }] };
      const thirdJob = await lolfi.ingest([worse]);
      expect(thirdJob.status).toBe('SUCCEEDED');

      const alerts = await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 2, `the changed anomaly must alert, got ${alerts.length} alerts`);

        return alerts;
      });

      expect(alerts[0]!.text).toContain('1 candidature et aucune proposition');
      expect(alerts[1]!.text).toContain('2 candidatures et aucune proposition');
    },
  );

  test('should report a transparence that never received its candidatures', async ({ admin, expect, lolfi }) => {
    const abandoned = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '01/01/2026',
      candidates: [],
    };

    const justAnnounced = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: publishedToday(),
      candidates: [],
    };

    const job = await lolfi.ingest([abandoned, justAnnounced]);
    expect(job.status).toBe('SUCCEEDED');

    const reported = await waitFor(async () => {
      const errors = await jobErrors(admin, job.id);
      const reported = errors.find(mentioning(abandoned.id));

      assert.ok(reported, `transparence ${abandoned.id} not reported on job #${job.id}`);
      assert.ok(
        !errors.some(mentioning(justAnnounced.id)),
        `transparence ${justAnnounced.id} was just announced and must be left the time to fill up`,
      );

      return reported;
    });

    expect(reported).toContain('aucune candidature reçue');
    expect(await findAlerts(justAnnounced.id)).toHaveLength(0);
  });

  test(
    'should alert again on a transparence that broke, was repaired, then broke the same way',
    { timeout: 40_000 },
    async ({ admin, expect, lolfi }) => {
      const candidate = trevoux();
      const complete = {
        id: crypto.randomInt(1_000, 900_000),
        name: crypto.randomUUID(),
        createdAt: '04/09/2026',
        candidates: [candidate],
      };
      // The session outlives the proposition, so both breakages read exactly the same:
      // only forgetting the repaired anomaly can explain a second alert
      const broken = { ...complete, candidates: [{ ...candidate, designated: false }] };

      const initial = await lolfi.ingest([complete]);
      expect(initial.status).toBe('SUCCEEDED');
      await findSessionId(admin, `${complete.name} (${complete.id})`);

      await ingestUntilEnded(lolfi, broken);
      await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 1, `the breakage must alert, got ${alerts.length}`);
      });

      // The job is SUCCEEDED before the reporting runs, so only the forgotten row tells us it is over
      const repairedJobId = await ingestUntilEnded(lolfi, complete);
      await waitFor(async () => {
        assert.equal(await recordedAnomaly(complete.id), undefined, `the repair must be forgotten`);
      });
      expect(await jobErrors(admin, repairedJobId)).not.toContainEqual(expect.stringContaining(`(${complete.id})`));

      await ingestUntilEnded(lolfi, broken);
      const alerts = await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 2, `the second breakage must alert, got ${alerts.length}`);

        return alerts;
      });

      expect(anomalyOf(alerts[1]!.text)).toBe(anomalyOf(alerts[0]!.text));
      expect(anomalyOf(alerts[1]!.text)).toContain('1 candidature et aucune proposition');
    },
  );

  test('should make inactive a magistrat absent from the last import', async ({ admin, expect, lolfi }) => {
    const lastName = randomLastName();
    const staying = { ...trevoux(), lastName };
    const leaving = { ...berger(), lastName };

    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [staying, leaving] });
    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [staying] });

    expect(await statusesOf(admin, lastName)).toEqual([
      { firstName: 'ETIENNE', status: 'ACTIVE' },
      { firstName: 'MICHEL', status: 'INACTIVE' },
    ]);
  });

  test('should list the active magistrats before the inactive ones', async ({ admin, expect, lolfi }) => {
    const lastName = randomLastName();
    const leaving = { ...trevoux(), lastName };
    const staying = { ...berger(), lastName };

    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [leaving, staying] });
    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [staying] });

    expect(await statusesOf(admin, lastName)).toEqual([
      { firstName: 'MICHEL', status: 'ACTIVE' },
      { firstName: 'ETIENNE', status: 'INACTIVE' },
    ]);
  });

  test('should keep active a magistrat the import rejects', async ({ admin, expect, lolfi }) => {
    const lastName = randomLastName();
    const rejected = { ...trevoux(), lastName };
    const leaving = { ...berger(), lastName };

    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [rejected, leaving] });
    await ingestUntilEnded(lolfi, {
      createdAt: '22/04/2026',
      candidates: [{ ...rejected, administrativePosition: 'UNKNOWN' }],
    });

    expect(await statusesOf(admin, lastName)).toEqual([
      { firstName: 'ETIENNE', status: 'ACTIVE' },
      { firstName: 'MICHEL', status: 'INACTIVE' },
    ]);
  });

  test('should keep the statuses when the import fails', async ({ admin, expect, lolfi }) => {
    const lastName = randomLastName();

    await ingestUntilEnded(lolfi, { createdAt: '22/04/2026', candidates: [{ ...trevoux(), lastName }] });
    const failedJob = await lolfi.ingest([
      {
        createdAt: '22/04/2026',
        candidates: [{ ...berger(), lastName: '' }],
      },
    ]);
    expect(failedJob.status).toBe('FAILED');

    expect(await statusesOf(admin, lastName)).toEqual([{ firstName: 'ETIENNE', status: 'ACTIVE' }]);
  });
});

function randomLastName(): string {
  return Array.from({ length: 12 }, () => String.fromCharCode(97 + crypto.randomInt(26))).join('');
}

async function statusesOf(admin: TestStepsAdmin, lastName: string): Promise<{ firstName: string; status: string }[]> {
  const { data } = await admin.magistrats.searchMagistrats({ query: { search: lastName }, throwOnError: true });

  return data!.items.map(({ firstName, status }) => ({ firstName, status }));
}

async function ingestUntilEnded(
  lolfi: LolfiFixture,
  session: LolfiArchiveContent['sessions'][number],
): Promise<number> {
  const job = await lolfi.ingest([session]);
  assert.equal(job.status, 'SUCCEEDED', `job #${job.id} did not succeed`);

  return job.id;
}

function anomalyOf(alert: string): string {
  return alert.split('\n')[0]!;
}

async function recordedAnomaly(lolfiSessionId: number): Promise<string | undefined> {
  const sql = postgres(inject('databaseUrl'), { onnotice: () => {} });

  try {
    const [anomaly] = await sql<{ reason: string }[]>`
      select reason from jobs.lolfi_transparence_anomaly where lolfi_session_id = ${lolfiSessionId}
    `;

    return anomaly?.reason;
  } finally {
    await sql.end();
  }
}

// The tolerance is counted from the publication, so this one must never age past it
function publishedToday(): string {
  return new Date().toLocaleDateString('fr-FR');
}

function trevoux() {
  return {
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
  } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number];
}

function berger() {
  return {
    id: crypto.randomInt(10_000, 19_999),
    firstName: 'MICHEL',
    lastName: 'BERGER',
    position: {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  REIMS'],
      function: seed.functions.PR,
    },
    targetPosition: {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  AMIENS'],
      function: seed.functions.PR,
    },
  } satisfies LolfiArchiveContent['sessions'][number]['candidates'][number];
}

async function jobErrors(admin: TestStepsAdmin, jobId: number): Promise<string[]> {
  const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });

  return data!.errors.map(({ error }) => error);
}

async function findAlerts(transparenceId: number): Promise<{ text: string; title: string }[]> {
  const messages = (await fetch(inject('tchapUrl')).then((response) => response.json())) as { body: string }[];
  const mentionsIt = mentioning(transparenceId);

  return messages
    .map(({ body }) => {
      const [title = '', ...text] = body.split('\n\n');

      return { text: text.join('\n\n'), title };
    })
    .filter(({ text }) => mentionsIt(text));
}

// The identifier alone would match another transparence that merely contains its digits
function mentioning(transparenceId: number): (message: string) => boolean {
  return (message) => message.includes(`(${transparenceId})`);
}

async function sessionsFileDigest(admin: TestStepsAdmin, jobId: number): Promise<string> {
  const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });
  const sessionsFile = data!.files.find((file) => file.name === 'SESSIONS.xml');

  assert.ok(sessionsFile, `job #${jobId} has no SESSIONS.xml`);

  return sessionsFile.fileSha256;
}

function findSessionId(admin: TestStepsAdmin, name: string): Promise<string> {
  return waitFor(async () => {
    const { data } = await admin.sessions.listSessionsOfTypeGardeDesSceaux({
      query: { search: name },
    });
    const [session] = data!.items;

    assert.ok(session, `session "${name}" is undefined`);

    return session.id;
  });
}
