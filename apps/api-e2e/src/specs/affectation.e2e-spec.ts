import { Magistrat } from 'shared-models';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Session Affectations E2E', () => {
  let sessionId: string;
  let nominationFileId: string;
  let memberId: string;

  test.beforeEach(async ({ agent, member, sessions, expect }) => {
    memberId = member['@user']!.id;

    const session = await sessions.createOne({
      name: 'Transparence affectation',
      createdAt: '22/04/2026',
      candidates: [
        {
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            grade: Magistrat.Grade.G3,
            jurisdiction: seed.jurisdictions['CA  LYON'],
            function: seed.functions.PR,
          },
          targetPosition: {
            grade: Magistrat.Grade.G3,
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            function: seed.functions.PR,
          },
        },
      ],
    });
    sessionId = session.id;

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.response?.status).toBe(200);
    nominationFileId = files.data!.items[0]!.id;
  });

  test("an unaffected session does not appear in the member's list", async ({ member, expect }) => {
    const memberSessions = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(memberSessions.data!.items).not.toContainEqual(expect.objectContaining({ id: sessionId }));
  });

  test('the affectation lifecycle preserves the report edition', async ({ agent, member, expect }) => {
    await agent.sessions.affectReporters({
      path: { sessionId },
      body: { items: [{ nominationFileId, reporterIds: [memberId], priorities: [] }] },
      throwOnError: true,
    });

    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
      throwOnError: true,
    });

    const affected = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(affected.data!.items).toContainEqual(expect.objectContaining({ id: sessionId, isAffected: true }));

    const { data: detailedSession } = await member.members.detailsMemberSession({
      path: { userId: memberId, sessionId },
    });
    const reportId = detailedSession!.items[0]!.id;

    await member.reports.updateReport({
      path: { reportId },
      body: { status: 'IN_PROGRESS' },
      throwOnError: true,
    });

    await agent.sessions.affectReporters({
      path: { sessionId },
      body: { items: [{ nominationFileId, reporterIds: [], priorities: [] }] },
      throwOnError: true,
    });

    const publishedAffectationsResponse = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
    });
    expect(publishedAffectationsResponse.response?.status).toBe(204);

    const unaffected = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(unaffected.data!.items).toContainEqual(expect.objectContaining({ id: sessionId, isAffected: false }));

    // Re-affecting must restore the previous report edition rather than resetting it
    await agent.sessions.affectReporters({
      path: { sessionId },
      body: { items: [{ nominationFileId, reporterIds: [memberId], priorities: [] }] },
      throwOnError: true,
    });

    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
      throwOnError: true,
    });

    const { data: reaffected } = await member.members.detailsMemberSession({
      path: { userId: memberId, sessionId },
    });
    const restoredReport = await member.reports.detailReport({
      path: { reportId: reaffected!.items[0]!.id },
    });
    expect(restoredReport.data!.state).toBe('IN_PROGRESS');
  });
});
