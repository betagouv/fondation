import type { LolfiData } from 'lolfi';

import { test } from '../fixtures.ts';
import type { TestStepsAgent } from '../steps.ts';
import * as seed from '../utils/seed.ts';

function candidate(firstName: string, lastName: string): LolfiData['sessions'][number]['candidates'][number] {
  return {
    firstName,
    lastName,
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
  };
}

test.describe('Session Outcomes E2E', () => {
  let sessionId: string;
  let fileIds: string[];

  test.beforeEach(async ({ agent, sessions, expect }) => {
    const session = await sessions.createOne({
      name: 'Transparence issues',
      createdAt: '22/04/2026',
      candidates: [candidate('ETIENNE', 'TREVOUX'), candidate('CAMILLE', 'BERNARD'), candidate('SOPHIE', 'MARTIN')],
    });
    sessionId = session.id;

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.response?.status).toBe(200);
    fileIds = files.data!.items.map(({ id }) => id);
  });

  function outcomesByFileId(agent: TestStepsAgent) {
    return agent.sessions
      .listNominationFiles({ path: { sessionId } })
      .then(({ data }) => new Map(data!.items.map((file) => [file.id, file.content.outcome])));
  }

  test('applies one outcome to several files at once', async ({ agent, expect }) => {
    const response = await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: {
        items: [
          { comment: null, nominationFileId: fileIds[0]! },
          { comment: null, nominationFileId: fileIds[1]! },
        ],
        outcome: 'VALIDATED',
      },
    });
    expect(response.response?.status).toBe(204);

    const outcomes = await outcomesByFileId(agent);
    expect(outcomes.get(fileIds[0]!)?.value).toBe('VALIDATED');
    expect(outcomes.get(fileIds[1]!)?.value).toBe('VALIDATED');
    expect(outcomes.get(fileIds[2]!)).toBeNull();
  });

  test('keeps one comment per file for the same outcome', async ({ agent, expect }) => {
    await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: {
        items: [
          { comment: 'Sursis pour TREVOUX', nominationFileId: fileIds[0]! },
          { comment: 'Sursis pour BERNARD', nominationFileId: fileIds[1]! },
        ],
        outcome: 'SUSPENDED',
      },
      throwOnError: true,
    });

    const outcomes = await outcomesByFileId(agent);
    expect(outcomes.get(fileIds[0]!)).toEqual({ value: 'SUSPENDED', comment: 'Sursis pour TREVOUX' });
    expect(outcomes.get(fileIds[1]!)).toEqual({ value: 'SUSPENDED', comment: 'Sursis pour BERNARD' });
  });

  test('clears the outcome of every listed file', async ({ agent, expect }) => {
    const items = fileIds.map((nominationFileId) => ({ comment: null, nominationFileId }));

    await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: { items, outcome: 'VALIDATED' },
      throwOnError: true,
    });

    await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: { items, outcome: null },
      throwOnError: true,
    });

    const outcomes = await outcomesByFileId(agent);
    for (const fileId of fileIds) expect(outcomes.get(fileId)).toBeNull();
  });

  test('refuses a batch without any file', async ({ agent, expect }) => {
    const response = await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: { items: [], outcome: 'VALIDATED' },
    });

    expect(response.response?.status).toBe(400);
  });

  test('refuses an outcome that requires a comment when one file has none', async ({ agent, expect }) => {
    const response = await agent.sessions.defineNominationFilesOutcome({
      path: { sessionId },
      body: {
        items: [
          { comment: 'Motif du premier', nominationFileId: fileIds[0]! },
          { comment: null, nominationFileId: fileIds[1]! },
        ],
        outcome: 'NON_VALIDATED',
      },
    });

    expect(response.response?.status).toBe(400);

    const outcomes = await outcomesByFileId(agent);
    for (const fileId of fileIds) expect(outcomes.get(fileId)).toBeNull();
  });
});
