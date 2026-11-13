import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import * as seed from '../utils/seed.ts';

const CANDIDATE = {
  firstName: 'ETIENNE',
  lastName: 'TREVOUX',
  position: {
    function: seed.functions.PR,
    grade: 'G3' as const,
    jurisdiction: seed.jurisdictions['CA  LYON'],
  },
  targetPosition: {
    function: seed.functions.PR,
    grade: 'G3' as const,
    jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
  },
};

test.describe('Report E2E', () => {
  let nominationFileId: string;
  let reportId: string;
  let sessionId: string;

  test.beforeEach(async ({ sessions, member }) => {
    // the member is affected so that a report is created for them
    const session = await sessions.createOne(
      { candidates: [CANDIDATE], createdAt: '22/04/2026', name: 'Transparence rapport' },
      { reporters: [member['@user']!] },
    );

    nominationFileId = session.files[0]!.id;
    sessionId = session.id;

    const reportsRes = await member.members.listMemberSessionReports({
      path: { sessionId, userId: member['@user']!.id },
      throwOnError: true,
    });

    reportId = reportsRes.data.items[0]!.report.id;
  });

  test('should find my report for a nomination file', async ({ logIn, member, expect }) => {
    const memberRes = await member.members.searchNominationFileMembersReport({
      path: { nominationFileId, sessionId, userId: member['@user']!.id },
    });
    expect(memberRes.response?.status).toBe(200);
    expect(memberRes.data?.report).toEqual({ id: reportId, state: 'NEW' });

    const memberWithoutReport = await logIn('MEMBRE_COMMUN');
    const withoutReportRes = await memberWithoutReport.members.searchNominationFileMembersReport({
      path: { nominationFileId, sessionId, userId: memberWithoutReport['@user']!.id },
    });
    expect(withoutReportRes.response?.status).toBe(200);
    expect(withoutReportRes.data?.report).toBeNull();

    const otherMemberRes = await member.members.searchNominationFileMembersReport({
      path: { nominationFileId, sessionId, userId: memberWithoutReport['@user']!.id },
    });
    expect(otherMemberRes.response?.status).toBe(403);
  });

  test('should list my session reports with their state', async ({ logIn, agent, member, expect }) => {
    const filesRes = await agent.sessions.listNominationFiles({ path: { sessionId } });
    const file = filesRes.data!.items[0]!;

    const memberRes = await member.members.listMemberSessionReports({
      path: { sessionId, userId: member['@user']!.id },
    });
    expect(memberRes.response?.status).toBe(200);
    expect(memberRes.data?.items).toEqual([
      {
        name: file.content.nomMagistrat,
        nominationFileId,
        number: file.content.numeroDeDossier,
        report: { id: reportId, state: 'NEW' },
      },
    ]);

    const memberWithoutReport = await logIn('MEMBRE_COMMUN');
    const withoutReportRes = await memberWithoutReport.members.listMemberSessionReports({
      path: { sessionId, userId: memberWithoutReport['@user']!.id },
    });
    expect(withoutReportRes.response?.status).toBe(200);
    expect(withoutReportRes.data?.items).toEqual([]);
  });

  test('should list my session reports ordered by file number', async ({ sessions, agent, member, expect }) => {
    // file numbers restart at 1 in each formation, so both candidates must stay in the same one
    const parquetCandidate = (firstName: string, lastName: string) => ({
      firstName,
      lastName,
      position: {
        function: seed.functions.PR,
        grade: 'G3' as const,
        jurisdiction: seed.jurisdictions['CA  LYON'],
      },
      targetPosition: {
        function: seed.functions.PR,
        grade: 'G3' as const,
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      },
    });

    const session = await sessions.createOne({
      candidates: [parquetCandidate('EMILE', 'ZOLA'), parquetCandidate('MARIE', 'ABEL')],
      createdAt: '22/04/2026',
      name: 'Transparence ordre des rapports',
    });

    const filesRes = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
    const filesByNumber = filesRes.data!.items;
    expect(filesByNumber).toHaveLength(2);

    const filesInReverseOrder = [...filesByNumber].reverse();
    const affectRes = await agent.sessions.affectReporters({
      body: {
        items: filesInReverseOrder.map((file) => ({
          nominationFileId: file.id,
          priorities: [],
          reporterIds: [member['@user']!.id],
        })),
      },
      path: { sessionId: session.id },
    });
    expect(affectRes.response?.status).toBe(204);

    const publishRes = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId: session.id },
    });
    expect(publishRes.response?.status).toBe(204);

    const reportsRes = await member.members.listMemberSessionReports({
      path: { sessionId: session.id, userId: member['@user']!.id },
    });
    expect(reportsRes.data!.items.map(({ name, number }) => ({ name, number }))).toEqual(
      filesByNumber.map(({ content }) => ({ name: content.nomMagistrat, number: content.numeroDeDossier })),
    );
  });

  test('should not list session reports of an unknown session', async ({ member, expect }) => {
    const unknownSessionRes = await member.members.listMemberSessionReports({
      path: { sessionId: crypto.randomUUID(), userId: member['@user']!.id },
    });
    expect(unknownSessionRes.response?.status).toBe(404);
  });

  test('should set aside the screenshots a report comment no longer embeds', async ({ expect, member }) => {
    const attached = await member.reports.attachScreenshots({
      body: { files: [makeFile({ name: 'a.png', type: 'image/png' }), makeFile({ name: 'b.png', type: 'image/png' })] },
      path: { reportId },
      throwOnError: true,
    });
    const [kept, removed] = attached.data.items;

    await member.reports.updateReport({
      body: { comment: `<p>Avis</p><img data-file-id="${kept!.id}" src="${kept!.url}">` },
      path: { reportId },
      throwOnError: true,
    });

    const { data } = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
    expect(data.screenshots.map(({ id }) => id)).toEqual([kept!.id]);

    await member.reports.updateReport({
      body: {
        comment: `<p>Avis</p><img data-file-id="${kept!.id}" src="${kept!.url}"><img data-file-id="${removed!.id}" src="${removed!.url}">`,
      },
      path: { reportId },
      throwOnError: true,
    });
    const reread = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
    expect(reread.data.screenshots.map(({ id }) => id).sort()).toEqual([kept!.id, removed!.id].sort());
  });

  test('should attach files to a report', async ({ member, expect }) => {
    const file = makeFile({ name: `image_${crypto.randomUUID()}.png`, type: 'image/png' });

    const attachmentRes = await member.reports.attachFiles({
      body: { files: [file] },
      path: { reportId },
      query: { usage: 'ATTACHMENT' },
    });
    expect(attachmentRes.response?.status).toBe(204);

    const responseBody = await member.reports.detailReport({ path: { reportId } });
    expect(responseBody.response?.status).toBe(200);
    expect(responseBody.data?.attachments.map(({ name }) => name)).toContain(file.name);
  });

  test('should detach one of two attachments of the same name, the other still opening', async ({ member, expect }) => {
    const name = `evaluation_${crypto.randomUUID()}.png`;
    await member.reports.attachFiles({
      body: { files: [makeFile({ name, type: 'image/png' }), makeFile({ name, type: 'image/png' })] },
      path: { reportId },
      query: { usage: 'ATTACHMENT' },
      throwOnError: true,
    });
    const before = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
    const [detached, kept] = before.data.attachments;

    await member.reports.detachAttachment({ path: { fileId: detached!.id, reportId }, throwOnError: true });

    const after = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
    expect(after.data.attachments.map(({ id }) => id)).toEqual([kept!.id]);
    const opened = await member.reports.getAttachmentUrl({
      path: { fileId: kept!.id, reportId },
      throwOnError: true,
    });
    expect(opened.data.id).toBe(kept!.id);
  });

  test('should leave a pasted screenshot in place when detaching it as an attachment', async ({ member, expect }) => {
    const attached = await member.reports.attachScreenshots({
      body: { files: [makeFile({ name: 'evaluation.png', type: 'image/png' })] },
      path: { reportId },
      throwOnError: true,
    });
    const [screenshot] = attached.data.items;
    await member.reports.updateReport({
      body: { comment: `<p>Avis</p><img data-file-id="${screenshot!.id}" src="${screenshot!.url}">` },
      path: { reportId },
      throwOnError: true,
    });

    await member.reports.detachAttachment({ path: { fileId: screenshot!.id, reportId }, throwOnError: true });

    const { data } = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
    expect(data.screenshots.map(({ id }) => id)).toEqual([screenshot!.id]);
  });
});
