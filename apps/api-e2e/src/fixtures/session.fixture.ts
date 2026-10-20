// oxlint-disable no-console
import * as assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { randomInt } from 'node:crypto';

import { generateLolfiArchive, type LolfiArchiveContent } from 'lolfi';

import type { DefineNominationFilesOutcomeDto } from '../generated/api/types.ts';
import { TestStepsAdmin } from '../steps.ts';
import { waitFor } from '../utils/wait-for.ts';

let sessionIdSequence = randomInt(1_000_000, 1_000_000_000);

type Candidate = LolfiArchiveContent['sessions'][number]['candidates'][number];

/** what a session has gone through before the scenario starts, the same for each of its nomination files */
export type SessionStage = {
  outcome?: { comment: string | null; value: NonNullable<DefineNominationFilesOutcomeDto['outcome']> };
  /** affected to every nomination file, then published */
  reporters?: readonly [{ id: string }, ...{ id: string }[]];
};

/** the nomination files come in the order of the candidates */
export type CreatedSession = { files: { id: string; magistratId: string }[]; id: string };

export function makeCreateSessionFixture(steps: TestStepsAdmin) {
  async function generateSessionsArchive(
    inputSessions: LolfiArchiveContent['sessions'],
  ): Promise<{ file: File; names: string[] }> {
    const [names, sessions] = inputSessions.reduce(
      ([sessionNames, list], inputSession) => {
        const sessionId = inputSession.id || ++sessionIdSequence;
        const sessionName = inputSession.name || 'Transparence annuelle';

        sessionNames.push(`${sessionName} (${sessionId})`);
        list.push({ ...inputSession, id: sessionId, name: sessionName });

        return [sessionNames, list];
      },
      [[] as string[], [] as LolfiArchiveContent['sessions']],
    );

    const archive = await generateLolfiArchive({ sessions });
    const file = new File([archive], `LOLFI_CSM_${new Date().toISOString()}.zip`, {
      type: 'application/zip',
    });

    return { file, names };
  }

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
    const { file, names } = await generateSessionsArchive(sessions);
    const jobId = await steps.ingest
      .ingestLolfiArchive({ body: { file }, throwOnError: true })
      .then(({ data }) => data!.id);

    await waitFor(async () => {
      const { errors, files, status } = await steps.jobs
        .detailsJob({ path: { jobId }, throwOnError: true })
        .then(({ data }) => data!);

      if (status === 'FAILED') {
        console.error(errors);
        console.error(files.map((file) => file.errors));
      }

      assert.ok(status === 'FAILED' || status === 'SUCCEEDED', `ingestion not done`);
    });

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
      created.push({ files, id });
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
