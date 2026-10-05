import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Summary E2E', () => {
  test('should remind the audition and the reporters expected on an auditioned position', async ({
    agent,
    expect,
    sessions,
  }) => {
    const session = await sessions.createOne({
      candidates: [
        {
          firstName: 'HONORINE',
          lastName: 'VALROSE',
          position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
          targetPosition: {
            function: seed.functions.PR,
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
          },
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });
    const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id }, throwOnError: true });
    const path = { nominationFileId: files.data!.items[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path, throwOnError: true });

    const summary = await agent.summaries.detailSummary({ path });

    expect(summary.response?.status).toBe(200);
    expect(summary.data).toMatchObject({ auditionExpected: true, canScheduleAudition: true, reportersMissing: true });
  });
});
