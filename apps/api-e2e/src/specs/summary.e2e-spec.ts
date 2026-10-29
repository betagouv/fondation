import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Summary E2E', () => {
  test('should attach a file heavier than five mebibytes to a summary', async ({ agent, expect, sessions }) => {
    const session = await sessions.createOne({
      candidates: [
        {
          firstName: 'HONORINE',
          lastName: 'VALROSE',
          position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
          targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  REIMS'] },
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });
    const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id }, throwOnError: true });
    const path = { nominationFileId: files.data!.items[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path, throwOnError: true });

    // a pdf would go through Ghostscript where it is installed, which rewrites it and changes its size
    const sizeInBytes = 6 * 1_024 * 1_024;
    const evaluation = new File([new Uint8Array(sizeInBytes)], 'évaluation 2023-2024.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await agent.summaries.attachSummaryFiles({ body: { files: [evaluation] }, path, throwOnError: true });

    const { data } = await agent.summaries.detailSummary({ path, throwOnError: true });
    expect(data.summary.attachments.map(({ name, size }) => ({ name, size }))).toEqual([
      { name: 'évaluation 2023-2024.docx', size: sizeInBytes },
    ]);
  });

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
    expect(summary.data).toMatchObject({ auditionRequired: true, canScheduleAudition: true, reportersMissing: true });
  });
});
