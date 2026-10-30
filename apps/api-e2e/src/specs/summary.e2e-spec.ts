import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import { isStored } from '../utils/screenshots.ts';
import * as seed from '../utils/seed.ts';
import { waitFor } from '../utils/wait-for.ts';

function pdf(name: string) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

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
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
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

  test('should set aside the screenshots a summary no longer embeds', async ({ agent, expect, sessions, sql }) => {
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
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path, throwOnError: true });

    const included = await agent.summaries.includeFilesInContent({
      body: { files: [makeFile({ name: 'a.png', type: 'image/png' }), makeFile({ name: 'b.png', type: 'image/png' })] },
      path,
      throwOnError: true,
    });
    const [kept, removed] = included.data.items;

    const content = `<p>Synthèse</p><img data-file-id="${kept!.id}" src="${kept!.url}">`;
    await agent.summaries.writeSummary({ body: { content }, path, throwOnError: true });

    const { data } = await agent.summaries.detailSummary({ path, throwOnError: true });
    expect(data.summary.screenshots.map(({ id }) => id)).toEqual([kept!.id]);
    expect(await isStored(sql, removed!.id)).toBe(true);
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
    sql,
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
      if (await isStored(sql, detachedFileId!)) throw new Error(`${detachedFileId} is still stored`);
    });

    const { data } = await agent.summaries.detailSummary({ path: kept!, throwOnError: true });
    expect(data.summary.attachments.map(({ id }) => id)).toEqual([keptFileId]);
  });

  test('should let only the author and the readers of a summary read it and its attachments', async ({
    agent,
    expect,
    logIn,
    member,
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
      ],
      createdAt: '22/04/2026',
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };

    await agent.summaries.createSummary({ path, throwOnError: true });
    await agent.summaries.attachSummaryFiles({ body: { files: [pdf('avis.pdf')] }, path, throwOnError: true });
    await agent.summaries.writeSummary({ body: { content: '<p>Synthèse</p>' }, path, throwOnError: true });

    const otherAgent = await logIn('ADJOINT_SECRETAIRE_GENERAL');
    const readers = await otherAgent.summaries.updateSummaryReadersList({
      body: { readerIds: [agent['@user']!.id, member['@user']!.id] },
      path,
    });
    expect(readers.response?.status).toBe(204);

    const read = await member.summaries.detailSummary({ path });
    expect(read.data!.summary.author?.id).toBe(agent['@user']!.id);
    // the author reads the summary already, the list only names the others
    expect(read.data!.summary.readers.map(({ id }) => id)).toEqual([member['@user']!.id]);

    const fileId = read.data!.summary.attachments[0]!.id;
    const url = await member.summaries.generateAttachmentPublicUrl({ path: { ...path, fileId } });
    expect(url.response?.status).toBe(200);

    const stranger = await logIn('MEMBRE_COMMUN');
    const unread = await stranger.summaries.detailSummary({ path });
    expect(unread.response?.status).toBe(404);
    const unreachable = await stranger.summaries.generateAttachmentPublicUrl({ path: { ...path, fileId } });
    expect(unreachable.response?.status).toBe(404);
  });

  test('should offer as readers the members of the formation and the secretariat, the president and the secretary general first', async ({
    admin,
    agent,
    expect,
    registerUser,
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
      ],
      createdAt: '22/04/2026',
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path, throwOnError: true });

    const president = await registerUser('MEMBRE_DU_PARQUET');
    await admin.administration.updateRole({
      body: { role: 'PRESIDENT_PARQUET' },
      path: { userId: president.id },
      throwOnError: true,
    });
    const secretary = await registerUser('ADJOINT_SECRETAIRE_GENERAL');
    await admin.administration.updateRole({
      body: { role: 'FIRST_SECRETARY' },
      path: { userId: secretary.id },
      throwOnError: true,
    });
    const officer = await registerUser('ADJOINT_SECRETAIRE_GENERAL');
    const otherFormation = await registerUser('MEMBRE_DU_SIEGE');

    const { data } = await agent.summaries.listSummaryReaders({ path, throwOnError: true });

    const ids = data.items.map(({ id }) => id);
    expect(ids.slice(0, 2)).toEqual([president.id, secretary.id]);
    expect(data.items[0]!.displayedRole.id).toBe('PRESIDENT_PARQUET');
    expect(ids).toContain(officer.id);
    expect(ids).not.toContain(otherFormation.id);
  });

  test('should keep a reader of a summary deactivated since', async ({
    admin,
    agent,
    expect,
    registerUser,
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
      ],
      createdAt: '22/04/2026',
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    const reader = await registerUser('MEMBRE_COMMUN');
    await agent.summaries.createSummary({ path, throwOnError: true });
    await agent.summaries.updateSummaryReadersList({ body: { readerIds: [reader.id] }, path, throwOnError: true });
    await admin.administration.deactivate({ path: { userId: reader.id }, throwOnError: true });

    const saved = await agent.summaries.updateSummaryReadersList({ body: { readerIds: [reader.id] }, path });
    expect(saved.response?.status).toBe(204);
  });

  test('should refuse a deactivated user as a new reader of a summary', async ({
    admin,
    agent,
    expect,
    registerUser,
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
      ],
      createdAt: '22/04/2026',
    });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    const leaving = await registerUser('MEMBRE_COMMUN');
    await agent.summaries.createSummary({ path, throwOnError: true });
    await admin.administration.deactivate({ path: { userId: leaving.id }, throwOnError: true });

    const refused = await agent.summaries.updateSummaryReadersList({ body: { readerIds: [leaving.id] }, path });
    expect(refused.response?.status).toBe(404);
  });
});
