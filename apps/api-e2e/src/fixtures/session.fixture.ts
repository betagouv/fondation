import * as assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';

import type { DefineNominationFilesOutcomeDto } from '../generated/api/types.ts';
import { TestStepsAdmin } from '../steps.ts';
import { waitFor } from '../utils/wait-for.ts';
import type { LolfiFixture } from './lolfi.fixture.ts';

let sessionIdSequence = randomInt(1_000_000, 1_000_000_000);

type Candidate = LolfiArchiveContent['sessions'][number]['candidates'][number];

/** what a session has gone through before the scenario starts, the same for each of its nomination files */
export type SessionStage = {
  outcome?: { comment: string | null; value: NonNullable<DefineNominationFilesOutcomeDto['outcome']> };
  /** affected to every nomination file, then published */
  reporters?: readonly [{ id: string }, ...{ id: string }[]];
};

/** the nomination files come in the order of the candidates, the name is unique to find the session in a list */
export type CreatedSession = { files: { id: string; magistratId: string }[]; id: string; name: string };

export function makeCreateSessionFixture(steps: TestStepsAdmin, lolfi: LolfiFixture) {
  async function findFiles(sessionId: string, candidates: readonly Candidate[]): Promise<CreatedSession['files']> {
    const { data } = await steps.sessions.listNominationFiles({
      path: { sessionId },
      query: { limit: candidates.length },
      throwOnError: true,
    });

    // homonyms are interchangeable: each one takes the next file bearing its name
    const taken = new Set<string>();

    return candidates.map(({ firstName, lastName }) => {
      const match = data.items.find(({ content, id }) => {
        const name = content.nomMagistrat.toLowerCase();
        return !taken.has(id) && name.includes(firstName.toLowerCase()) && name.includes(lastName.toLowerCase());
      });
      assert.ok(match, `${firstName} ${lastName} matches no nomination file left`);
      taken.add(match.id);

      const { content, id } = match;
      assert.ok(content.detectedMagistratId, `${firstName} ${lastName} has no detected magistrat`);

      return { id, magistratId: content.detectedMagistratId };
    });
  }

  async function bringTo(sessionId: string, files: CreatedSession['files'], stage: SessionStage): Promise<void> {
    if (stage.reporters) {
      const reporterIds = stage.reporters.map(({ id }) => id);
      await steps.sessions.affectReporters({
        body: { items: files.map(({ id }) => ({ nominationFileId: id, reporterIds })) },
        path: { sessionId },
        throwOnError: true,
      });
      await steps.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId }, throwOnError: true });
    }

    if (stage.outcome) {
      const { comment, value } = stage.outcome;
      await steps.sessions.defineNominationFilesOutcome({
        body: { items: files.map(({ id }) => ({ comment, nominationFileId: id })), outcome: value },
        path: { sessionId },
        throwOnError: true,
      });
    }
  }

  async function createMultipleSessions(
    sessions: LolfiArchiveContent['sessions'],
    stage: SessionStage = {},
  ): Promise<CreatedSession[]> {
    const named = sessions.map((session) => ({
      ...session,
      id: session.id || ++sessionIdSequence,
      name: session.name || 'Transparence annuelle',
    }));
    const names = named.map(({ id, name }) => `${name} (${id})`);
    const job = await lolfi.ingest(named);
    if (job.status === 'FAILED') {
      const { files, messages } = await steps.jobs
        .detailsJob({ path: { jobId: job.id }, throwOnError: true })
        .then(({ data }) => data);
      assert.fail(`job #${job.id} failed: ${JSON.stringify({ files: files.map((file) => file.messages), messages })}`);
    }

    // the sessions are synchronised once the job succeeded
    const sessionIds = await waitFor(async () => {
      const result: string[] = [];
      for (const name of names) {
        const [firstSession] = await steps.sessions
          .listSessionsOfTypeGardeDesSceaux({ query: { search: name } })
          .then(({ data }) => data!.items);

        assert.ok(firstSession, `session "${name}" is undefined`);
        result.push(firstSession.id);
      }

      return result;
    });

    const created: CreatedSession[] = [];
    for (const [index, id] of sessionIds.entries()) {
      const files = await findFiles(id, sessions[index]!.candidates);
      await bringTo(id, files, stage);
      created.push({ files, id, name: names[index]! });
    }

    return created;
  }

  async function createSession(
    inputSession: LolfiArchiveContent['sessions'][number],
    stage: SessionStage = {},
  ): Promise<CreatedSession> {
    const [session] = await createMultipleSessions([inputSession], stage);
    assert.ok(session, `unknown session`);

    return session;
  }

  return { createMany: createMultipleSessions, createOne: createSession };
}
