import * as assert from 'node:assert/strict';
import { File } from 'node:buffer';
import * as crypto from 'node:crypto';

import { generateLolfiArchive, type LolfiData } from 'lolfi';
import postgres from 'postgres';
import { inject } from 'vitest';

import { test } from '../fixtures.ts';
import { createClient, createConfig } from '../generated/api/client/index.ts';
import { ingest } from '../generated/api/sdk.ts';
import type { TestStepsAdmin } from '../steps.ts';
import { machineToken } from '../utils/e2e-tokens.ts';
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

  test('should accept an archive sent with a machine token', async ({ admin, baseUrl, expect }) => {
    const jobId = await ingestArchiveAsMachine(baseUrl, {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: publishedToday(),
      candidates: [trevoux()],
    });

    expect(await waitForEndedJob(admin, jobId)).toBe('SUCCEEDED');
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

  test('should attach new files when the sessions file did not change', async ({ admin, expect }) => {
    const position = {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  LYON'],
      function: seed.functions.PR,
    } satisfies LolfiData['sessions'][number]['candidates'][number]['position'];

    const targetPosition = {
      grade: 'G3',
      jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      function: seed.functions.PR,
    } satisfies LolfiData['sessions'][number]['candidates'][number]['targetPosition'];

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

    const firstJobId = await ingestArchive(admin, { ...unchangedSession, candidates: [etienne] });
    expect(await waitForEndedJob(admin, firstJobId)).toBe('SUCCEEDED');

    const secondJobId = await ingestArchive(admin, {
      ...unchangedSession,
      candidates: [etienne, michel],
    });
    expect(await waitForEndedJob(admin, secondJobId)).toBe('SUCCEEDED');

    expect(await sessionsFileDigest(admin, secondJobId)).toBe(await sessionsFileDigest(admin, firstJobId));

    const sessionId = await findSessionId(admin, `${unchangedSession.name} (${unchangedSession.id})`);

    const totalCount = await waitFor(
      async () => {
        const files = await admin.sessions.listNominationFiles({ path: { sessionId } });
        assert.equal(files.data!.totalCount, 2);

        return files.data!.totalCount;
      },
      { timeout: 5_000 },
    );

    expect(totalCount).toBe(2);
  });

  test('should report a transparence received without a single proposition', async ({ admin, expect }) => {
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

    const jobId = await ingestArchive(admin, withoutProposition, nominal);
    expect(await waitForEndedJob(admin, jobId)).toBe('SUCCEEDED');

    const reported = await waitFor(async () => {
      const errors = await jobErrors(admin, jobId);
      const reported = errors.find(mentioning(withoutProposition.id));

      assert.ok(reported, `transparence ${withoutProposition.id} not reported on job #${jobId}`);
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

    expect(alerts[0]!.title).toBe(':alert: Transparence LOLFI incomplète');
    expect(alerts[0]!.text).toContain('aucune proposition');
  });

  test(
    'should alert once for a transparence that stays broken, and again when it changes',
    { timeout: 20_000 },
    async ({ admin, expect }) => {
      const broken = {
        id: crypto.randomInt(1_000, 900_000),
        name: crypto.randomUUID(),
        createdAt: '04/09/2026',
        candidates: [{ ...trevoux(), designated: false }],
      };

      const firstJobId = await ingestArchive(admin, broken);
      expect(await waitForEndedJob(admin, firstJobId)).toBe('SUCCEEDED');
      await waitFor(async () => {
        assert.equal((await findAlerts(broken.id)).length, 1, `the first import must alert`);
      });

      const secondJobId = await ingestArchive(admin, broken);
      expect(await waitForEndedJob(admin, secondJobId)).toBe('SUCCEEDED');
      await waitFor(async () => {
        const errors = await jobErrors(admin, secondJobId);
        assert.ok(
          errors.some(mentioning(broken.id)),
          `transparence ${broken.id} must stay reported on job #${secondJobId}`,
        );
      });
      expect(await findAlerts(broken.id)).toHaveLength(1);

      const worse = { ...broken, candidates: [...broken.candidates, { ...berger(), designated: false }] };
      const thirdJobId = await ingestArchive(admin, worse);
      expect(await waitForEndedJob(admin, thirdJobId)).toBe('SUCCEEDED');

      const alerts = await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 2, `the changed anomaly must alert, got ${alerts.length} alerts`);

        return alerts;
      });

      expect(alerts[0]!.text).toContain('1 candidature et aucune proposition');
      expect(alerts[1]!.text).toContain('2 candidatures et aucune proposition');
    },
  );

  test('should report a transparence that never received its candidatures', async ({ admin, expect }) => {
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

    const jobId = await ingestArchive(admin, abandoned, justAnnounced);
    expect(await waitForEndedJob(admin, jobId)).toBe('SUCCEEDED');

    const reported = await waitFor(async () => {
      const errors = await jobErrors(admin, jobId);
      const reported = errors.find(mentioning(abandoned.id));

      assert.ok(reported, `transparence ${abandoned.id} not reported on job #${jobId}`);
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
    async ({ admin, expect }) => {
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

      const initial = await ingestArchive(admin, complete);
      expect(await waitForEndedJob(admin, initial)).toBe('SUCCEEDED');
      await findSessionId(admin, `${complete.name} (${complete.id})`);

      await ingestUntilEnded(admin, broken);
      await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 1, `the breakage must alert, got ${alerts.length}`);
      });

      // The job is SUCCEEDED before the reporting runs, so only the forgotten row tells us it is over
      const repairedJobId = await ingestUntilEnded(admin, complete);
      await waitFor(async () => {
        assert.equal(await recordedAnomaly(complete.id), undefined, `the repair must be forgotten`);
      });
      expect(await jobErrors(admin, repairedJobId)).not.toContainEqual(expect.stringContaining(`(${complete.id})`));

      await ingestUntilEnded(admin, broken);
      const alerts = await waitFor(async () => {
        const alerts = await findAlerts(broken.id);
        assert.equal(alerts.length, 2, `the second breakage must alert, got ${alerts.length}`);

        return alerts;
      });

      expect(anomalyOf(alerts[1]!.text)).toBe(anomalyOf(alerts[0]!.text));
      expect(anomalyOf(alerts[1]!.text)).toContain('1 candidature et aucune proposition');
    },
  );
});

async function ingestArchiveAsMachine(baseUrl: string, ...sessions: LolfiData['sessions']): Promise<number> {
  const archive = await generateLolfiArchive({ sessions });
  const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, {
    type: 'application/zip',
  });
  const client = createClient(createConfig({ baseUrl, headers: { Authorization: `Bearer ${machineToken}` } }));

  const { data } = await ingest.ingestLolfiArchive({ client, body: { file }, throwOnError: true });

  return data!.id;
}

async function ingestUntilEnded(admin: TestStepsAdmin, session: LolfiData['sessions'][number]): Promise<number> {
  const jobId = await ingestArchive(admin, session);
  assert.equal(await waitForEndedJob(admin, jobId), 'SUCCEEDED', `job #${jobId} did not succeed`);

  return jobId;
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
  } satisfies LolfiData['sessions'][number]['candidates'][number];
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
  } satisfies LolfiData['sessions'][number]['candidates'][number];
}

async function jobErrors(admin: TestStepsAdmin, jobId: number): Promise<string[]> {
  const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });

  return data!.errors.map(({ error }) => error);
}

async function findAlerts(transparenceId: number): Promise<{ title: string; text: string }[]> {
  const alerts = (await fetch(inject('mattermostUrl')).then((response) => response.json())) as {
    attachments: { title: string; text: string }[];
  }[];

  const mentionsIt = mentioning(transparenceId);

  return alerts.flatMap(({ attachments }) => attachments).filter(({ text }) => mentionsIt(text));
}

// The identifier alone would match another transparence that merely contains its digits
function mentioning(transparenceId: number): (message: string) => boolean {
  return (message) => message.includes(`(${transparenceId})`);
}

async function ingestArchive(admin: TestStepsAdmin, ...sessions: LolfiData['sessions']): Promise<number> {
  const archive = await generateLolfiArchive({ sessions });
  const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, {
    type: 'application/zip',
  });

  const { data } = await admin.ingest.ingestLolfiArchive({ body: { file }, throwOnError: true });

  return data!.id;
}

async function sessionsFileDigest(admin: TestStepsAdmin, jobId: number): Promise<string> {
  const { data } = await admin.jobs.detailsJob({ path: { jobId }, throwOnError: true });
  const sessionsFile = data!.files.find((file) => file.name === 'SESSIONS.xml');

  assert.ok(sessionsFile, `job #${jobId} has no SESSIONS.xml`);

  return sessionsFile.fileSha256;
}

function findSessionId(admin: TestStepsAdmin, name: string): Promise<string> {
  return waitFor(
    async () => {
      const { data } = await admin.sessions.listSessionsOfTypeGardeDesSceaux({
        query: { search: name },
      });
      const [session] = data!.items;

      assert.ok(session, `session "${name}" is undefined`);

      return session.id;
    },
    { timeout: 5_000 },
  );
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
