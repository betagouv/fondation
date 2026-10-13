import postgres from 'postgres';
import { inject } from 'vitest';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';
import { waitFor } from '../utils/wait-for.ts';

async function isStored(fileId: string): Promise<boolean> {
  const sql = postgres(inject('databaseUrl'), { onnotice: () => {} });

  try {
    const [row] = await sql<{ count: bigint }[]>`select count(*) from files_context.files where id = ${fileId}`;

    return Number(row?.count ?? 0) > 0;
  } finally {
    await sql.end();
  }
}

function pdf(name: string) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

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
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path, throwOnError: true });

    const summary = await agent.summaries.detailSummary({ path });

    expect(summary.response?.status).toBe(200);
    expect(summary.data).toMatchObject({ auditionRequired: true, canScheduleAudition: true, reportersMissing: true });
  });

  test('should detach a file from a summary without touching the files of another one', async ({
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
          targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  REIMS'] },
        },
        {
          firstName: 'AUGUSTIN',
          lastName: 'MERCIER',
          position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  AMIENS'] },
          targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
        },
      ],
      createdAt: '22/04/2026',
    });
    const [detached, kept] = session.files.map(({ id }) => ({ nominationFileId: id, sessionId: session.id }));

    const attach = async (path: { nominationFileId: string; sessionId: string }, name: string) => {
      await agent.summaries.createSummary({ path, throwOnError: true });
      await agent.summaries.attachSummaryFiles({ body: { files: [pdf(name)] }, path, throwOnError: true });
      const { data } = await agent.summaries.detailSummary({ path, throwOnError: true });
      return data.summary.attachments.map(({ id }) => id);
    };
    const [detachedFileId] = await attach(detached!, 'avis.pdf');
    const [keptFileId] = await attach(kept!, 'rapport.pdf');

    const detachment = await agent.summaries.detachSummaryFiles({
      path: detached!,
      query: { fileIds: [detachedFileId!, keptFileId!] },
    });
    expect(detachment.response?.status).toBe(204);

    // the files are deleted after the commit, both at once: once the detached one is gone, the other is settled
    await waitFor(async () => {
      if (await isStored(detachedFileId!)) throw new Error(`${detachedFileId} is still stored`);
    });

    const { data } = await agent.summaries.detailSummary({ path: kept!, throwOnError: true });
    expect(data.summary.attachments.map(({ id }) => id)).toEqual([keptFileId]);
  });

});
