// oxlint-disable no-console
import * as assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';

import { generateLolfiArchive, type LolfiData } from 'lolfi';

import { TestStepsAdmin } from '../steps.ts';
import { waitFor } from '../utils/wait-for.ts';

let sessionIdSequence = randomInt(1_000_000, 1_000_000_000);

export function makeCreateSessionFixture(steps: TestStepsAdmin) {
  async function generateSessionsArchive(
    inputSessions: LolfiData['sessions'],
  ): Promise<{ file: File; names: string[] }> {
    const [names, sessions] = inputSessions.reduce(
      ([sessionNames, list], inputSession) => {
        const sessionId = inputSession.id || ++sessionIdSequence;
        const sessionName = inputSession.name || 'Transparence annuelle';

        sessionNames.push(`${sessionName} (${sessionId})`);
        list.push({ ...inputSession, id: sessionId, name: sessionName });

        return [sessionNames, list];
      },
      [[] as string[], [] as LolfiData['sessions']],
    );

    const archive = await generateLolfiArchive({ sessions });
    const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, {
      type: 'application/zip',
    });

    return { file, names };
  }

  async function createMultipleSessions(sessions: LolfiData['sessions']): Promise<{ id: string }[]> {
    const { names, file } = await generateSessionsArchive(sessions);
    const jobId = await steps.ingest
      .ingestLolfiArchive({ body: { file }, throwOnError: true })
      .then(({ data }) => data!.id);

    await waitFor(
      async () => {
        const { status, errors, files } = await steps.jobs
          .detailsJob({ path: { jobId }, throwOnError: true })
          .then(({ data }) => data!);

        if (status === 'FAILED') {
          console.error(errors);
          console.error(files.map((file) => file.errors));
        }

        assert.ok(status === 'FAILED' || status === 'SUCCEEDED', `ingestion not done`);
      },
      { timeout: 2_000 },
    );

    const result: { id: string }[] = [];
    await waitFor(
      async () => {
        for (const name of names) {
          const [firstSession] = await steps.sessions
            .listSessionsOfTypeGardeDesSceaux({ query: { search: name } })
            .then(({ data }) => data!.items);

          assert.ok(firstSession, `session "${name}" is undefined`);
          result.push({ id: firstSession.id });
        }
      },
      { timeout: 2_000 },
    );

    return result;
  }

  async function createSession(inputSession: LolfiData['sessions'][number]): Promise<{ id: string }> {
    const [session] = await createMultipleSessions([inputSession]);
    assert.ok(session, `unknown session`);

    return session;
  }

  return { createOne: createSession, createMany: createMultipleSessions };
}
