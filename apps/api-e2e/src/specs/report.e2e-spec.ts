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

  // a reporter can no longer be recused: only a member recused before their affectation becomes a recused reporter
  test.describe('Given a member recused, then affected', () => {
    test.beforeEach(async ({ agent, member, sessions }) => {
      const session = await sessions.createOne({
        candidates: [CANDIDATE],
        createdAt: '22/04/2026',
        name: 'Transparence rapporteur déporté',
      });
      nominationFileId = session.files[0]!.id;
      sessionId = session.id;
      const userId = member['@user']!.id;

      await agent.sessions.recuseMembers({
        body: { memberIds: [userId] },
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });
      await agent.sessions.affectReporters({
        body: { items: [{ nominationFileId, reporterIds: [userId] }] },
        path: { sessionId },
        throwOnError: true,
      });
      await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId }, throwOnError: true });

      const reportsRes = await member.members.listMemberSessionReports({
        path: { sessionId, userId },
        throwOnError: true,
      });
      reportId = reportsRes.data.items[0]!.report.id;
    });

    test('should show a recused reporter their report as not applicable until the recusal is withdrawn', async ({
      agent,
      member,
      expect,
    }) => {
      const memberPath = { nominationFileId, sessionId, userId: member['@user']!.id };

      const recused = await member.members.listMemberSessionReports({ path: memberPath, throwOnError: true });
      expect(recused.data.items.map(({ report }) => report)).toEqual([{ id: reportId, state: 'NOT_APPLICABLE' }]);
      const found = await member.members.searchNominationFileMembersReport({ path: memberPath, throwOnError: true });
      expect(found.data.report).toEqual({ id: reportId, state: 'NOT_APPLICABLE' });
      const detailed = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
      expect(detailed.data.state).toBe('NOT_APPLICABLE');

      await agent.sessions.recuseMembers({
        body: { memberIds: [] },
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });
      const withdrawn = await member.members.searchNominationFileMembersReport({
        path: memberPath,
        throwOnError: true,
      });
      expect(withdrawn.data.report).toEqual({ id: reportId, state: 'NEW' });
    });

    test('should lock the report of a recused reporter', async ({ member, expect }) => {
      const { data } = await member.reports.detailReport({ path: { reportId }, throwOnError: true });
      expect(data.lockedReason).toBe('RECUSED');
      const updated = await member.reports.updateReport({ body: { comment: '<p>Avis</p>' }, path: { reportId } });
      expect(updated.response?.status).toBe(403);
    });
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

  test('should detach files from a report', async ({ member, expect }) => {
    const [file1, file2] = [null, null].map((_, i) =>
      makeFile({ name: `image_${i + 1}_${crypto.randomUUID()}.png`, type: 'image/png' }),
    ) as [File, File];

    const attachmentRes = await member.reports.attachFiles({
      body: { files: [file1, file2] },
      path: { reportId },
      query: { usage: 'ATTACHMENT' },
    });
    expect(attachmentRes.response?.status).toBe(204);

    const reportResBefore = await member.reports.detailReport({ path: { reportId } });
    expect(reportResBefore.data?.attachments).toHaveLength(2);

    const deleteAttachmentRes = await member.reports.detachFiles({
      path: { reportId },
      query: { fileNames: file1.name },
    });
    expect(deleteAttachmentRes.response?.status).toBe(204);

    const reportResAfter = await member.reports.detailReport({ path: { reportId } });
    expect(reportResAfter.data?.attachments).toHaveLength(1);

    expect(reportResAfter.data?.attachments.map(({ name }) => name)).not.toContain(file1.name);
    expect(reportResAfter.data?.attachments.map(({ name }) => name)).toContain(file2.name);
  });
});
