import { Magistrat } from 'shared-models';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Docs Service', () => {
  let chairmanId: string;
  let sessionId: string;

  test.beforeEach(async ({ agent, sessions, registerUser, expect }) => {
    const chairman = await registerUser('MEMBRE_DU_PARQUET');

    const titleUpdateResponse = await agent.members.updateTitle({
      path: { userId: chairman.id },
      body: { title: 'PRESIDENT_PARQUET' },
    });
    expect(titleUpdateResponse.response.status).toBe(204);

    chairmanId = chairman.id;

    const session = await sessions.createOne({
      createdAt: '23/04/2026',
      candidates: [
        {
          firstName: 'ANTONIO',
          lastName: 'GRAMSCI',
          civilite: 'M.',
          position: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  AMIENS'],
            grade: Magistrat.Grade.G3,
          },
          targetPosition: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  REIMS'],
            grade: Magistrat.Grade.G3,
          },
        },
        {
          firstName: 'HANNAH',
          lastName: 'ARENDT',
          civilite: 'MME',
          position: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            grade: Magistrat.Grade.G3,
          },
          targetPosition: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  LYON'],
            grade: Magistrat.Grade.G3,
          },
        },
      ],
    });
    sessionId = session.id;

    const validateRes = await agent.sessions.validateSession({ path: { sessionId } });
    expect(validateRes.response.status).toBe(204);

    const publishRes = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
    });
    expect(publishRes.response.status).toBe(204);
  });

  test('should prevent creating an agenda with twice the same file', async ({ agent, expect }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundFiles.response.status).toBe(200);
    expect(foundFiles.data!.items).toHaveLength(2);

    for (const { id } of foundFiles.data!.items) {
      const outcomeRes = await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId: id },
        body: { comment: null, outcome: 'VALIDATED' },
      });
      expect(outcomeRes.response.status).toBe(204);
    }

    const firstFileId = foundFiles.data!.items[0]!.id;

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [firstFileId],
      },
    });
    expect(agenda.response.status).toBe(201);
    expect(agenda.data).toEqual({ id: expect.any(String) });

    const foundAfter = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundAfter.data!.items).toHaveLength(1);

    const duplicateAgenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 2, month: 2, year: 2026 },
        sessionMeetingDate: { day: 11, month: 2, year: 2026 },
        nominationFileIds: [firstFileId],
      },
    });
    expect(duplicateAgenda.response.status).toBe(400);
  });
});
