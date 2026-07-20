import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import * as seed from '../utils/seed.ts';

test.describe('Report E2E', () => {
  let nominationFileId: string;
  let reportId: string;

  test.beforeEach(async ({ sessions, agent, member, expect }) => {
    // Create a session and assign the member so a report is created automatically
    const session = await sessions.createOne({
      name: 'Transparence rapport',
      createdAt: '22/04/2026',
      candidates: [
        {
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
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
        },
      ],
    });

    const filesResponse = await agent.sessions.listNominationFiles({
      path: { sessionId: session.id },
    });
    expect(filesResponse.response?.status).toBe(200);

    nominationFileId = filesResponse.data!.items[0]!.id;

    const affectResponse = await agent.sessions.affectReporters({
      path: { sessionId: session.id },
      body: { items: [{ nominationFileId, reporterIds: [member['@user']!.id], priorities: [] }] },
    });
    expect(affectResponse.response?.status).toBe(204);

    const publishResponse = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId: session.id },
    });
    expect(publishResponse.response?.status).toBe(204);

    const memberId = member['@user']!.id;
    const reportsRes = await member.members.detailsMemberSession({
      path: { userId: memberId, sessionId: session.id },
    });

    reportId = reportsRes.data!.items[0]!.id;
  });

  test('should find my report for a nomination file', async ({ logIn, member, expect }) => {
    const memberRes = await member.reports.searchMyReport({ path: { nominationFileId } });
    expect(memberRes.response?.status).toBe(200);
    expect(memberRes.data?.reportId).toBe(reportId);

    const memberWithoutReport = await logIn('MEMBRE_COMMUN');
    const withoutReportRes = await memberWithoutReport.reports.searchMyReport({ path: { nominationFileId } });
    expect(withoutReportRes.response?.status).toBe(200);
    expect(withoutReportRes.data?.reportId).toBeNull();
  });

  test('should attach files to a report', async ({ member, expect }) => {
    const file = makeFile({ type: 'image/png', name: `image_${crypto.randomUUID()}.png` });

    const attachmentRes = await member.reports.attachFiles({
      path: { reportId },
      body: { files: [file] },
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
      path: { reportId },
      body: { files: [file1, file2] },
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
