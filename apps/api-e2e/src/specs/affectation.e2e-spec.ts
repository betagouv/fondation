import { test } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import * as seed from '../utils/seed.ts';

test.describe('Session Affectations E2E', () => {
  let sessionId: string;
  let nominationFileId: string;
  let memberId: string;

  test.beforeEach(async ({ agent, expect, member, sessions }) => {
    memberId = member['@user']!.id;

    const session = await sessions.createOne({
      candidates: [
        {
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            function: seed.functions.PR,
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  LYON'],
          },
          targetPosition: {
            function: seed.functions.PR,
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
          },
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence affectation',
    });
    sessionId = session.id;

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.response?.status).toBe(200);
    nominationFileId = files.data!.items[0]!.id;
  });

  test("an unaffected session does not appear in the member's list", async ({ expect, member }) => {
    const memberSessions = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(memberSessions.data!.items).not.toContainEqual(expect.objectContaining({ id: sessionId }));
  });

  test('shows a member no reporter while the affectation is only a draft', async ({ agent, expect, member }) => {
    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [memberId] }] },
      path: { sessionId },
      throwOnError: true,
    });

    const files = await api.sessions.listNominationFiles({
      client: member['@client'],
      path: { sessionId },
      throwOnError: true,
    });
    expect(files.data.items.map(({ reporters }) => reporters)).toEqual([[]]);
  });

  test('never auto-affects a member a file of a jurisdiction they exclude', async ({ agent, expect, registerUser }) => {
    const excluding = await registerUser('MEMBRE_COMMUN');
    await agent.members.excludeJurisdictions({
      body: { jurisdictionIds: [seed.jurisdictions['CA  LYON'].id] },
      path: { userId: excluding.id },
    });

    // every other member of the test database stays out, for the excluding one to be the only candidate
    const otherMemberIds: string[] = [];
    for (let page = 1; ; page++) {
      const members = await agent.members.listMembers({ query: { formations: [], limit: 200, page } });
      otherMemberIds.push(...members.data!.items.map(({ id }) => id).filter((id) => id !== excluding.id));
      if (members.data!.items.length < 200) break;
    }

    const affected = await agent.sessions.autoAffectation({
      body: { excludedMemberIds: otherMemberIds, nominationFileIds: [nominationFileId] },
      path: { sessionId },
    });
    expect(affected.response?.status).toBe(204);

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.data!.items[0]!.reporters).toEqual([]);
  });

  test('counts a nomination file once whatever its number of reporters', async ({ agent, expect, logIn }) => {
    const secondMember = await logIn('MEMBRE_COMMUN');

    await agent.sessions.affectReporters({
      body: {
        items: [{ nominationFileId, reporterIds: [memberId, secondMember['@user']!.id] }],
      },
      path: { sessionId },
      throwOnError: true,
    });

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });

    expect(files.data!.items[0]!.reporters).toHaveLength(2);
    expect(files.data!.totalCount).toBe(files.data!.items.length);
  });

  test('keeps a reporter deactivated since on the file they already have', async ({ admin, agent, expect }) => {
    const body = { items: [{ nominationFileId, reporterIds: [memberId] }] };
    await agent.sessions.affectReporters({ body, path: { sessionId }, throwOnError: true });
    await admin.administration.deactivate({ path: { userId: memberId }, throwOnError: true });

    const saved = await agent.sessions.affectReporters({ body, path: { sessionId } });
    expect(saved.response?.status).toBe(204);

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.data!.items[0]!.reporters).toEqual([expect.objectContaining({ id: memberId })]);
  });

  test('refuses to affect a deactivated member to a file', async ({ admin, agent, expect, registerUser }) => {
    const leaving = await registerUser('MEMBRE_COMMUN');
    await admin.administration.deactivate({ path: { userId: leaving.id }, throwOnError: true });

    const affected = await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [leaving.id] }] },
      path: { sessionId },
    });
    expect(affected.response?.status).toBe(400);
  });

  test('counts the nomination files by status along the affectation', async ({ agent, expect }) => {
    const counts = async () => {
      const { data } = await agent.sessions.countNominationFilesByStatus({ path: { sessionId } });
      return data!;
    };

    expect(await counts()).toEqual({
      inProgress: 0,
      missingEvaluation: 0,
      missingEvaluationWithComment: 0,
      total: 1,
      unaffected: 1,
      withOutcome: 0,
    });

    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [memberId] }] },
      path: { sessionId },
      throwOnError: true,
    });

    expect(await counts()).toEqual({
      inProgress: 1,
      missingEvaluation: 0,
      missingEvaluationWithComment: 0,
      total: 1,
      unaffected: 0,
      withOutcome: 0,
    });

    await agent.sessions.defineNominationFileOutcome({
      body: { comment: null, outcome: 'VALIDATED' },
      path: { nominationFileId, sessionId },
      throwOnError: true,
    });

    expect(await counts()).toEqual({
      inProgress: 0,
      missingEvaluation: 0,
      missingEvaluationWithComment: 0,
      total: 1,
      unaffected: 0,
      withOutcome: 1,
    });
  });

  test('the affectation lifecycle preserves the report edition', async ({ agent, expect, member }) => {
    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [memberId] }] },
      path: { sessionId },
      throwOnError: true,
    });

    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
      throwOnError: true,
    });

    const affected = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(affected.data!.items).toContainEqual(expect.objectContaining({ id: sessionId, isAffected: true }));

    const { data: memberReports } = await member.members.listMemberSessionReports({
      path: { sessionId, userId: memberId },
    });
    const reportId = memberReports!.items[0]!.report.id;

    await member.reports.updateReport({
      body: { status: 'IN_PROGRESS' },
      path: { reportId },
      throwOnError: true,
    });

    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [] }] },
      path: { sessionId },
      throwOnError: true,
    });

    // changing the reporters after a publication reopens the affectations, in the name of whoever did it
    const history = await agent.sessions.detailAffectationHistory({ path: { sessionId } });
    expect(history.data).toMatchObject({ lastPublished: { version: 1 }, pending: { version: 2 } });
    expect(history.data!.pending!.openedBy).not.toBeNull();
    expect(history.data!.pending!.openedBy).toEqual(history.data!.lastPublished!.by);

    const publishedAffectationsResponse = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
    });
    expect(publishedAffectationsResponse.response?.status).toBe(204);

    const unaffected = await member.members.listMemberSessions({ path: { userId: memberId } });
    expect(unaffected.data!.items).toContainEqual(expect.objectContaining({ id: sessionId, isAffected: false }));

    const { data: removedReports } = await member.members.listMemberSessionReports({
      path: { sessionId, userId: memberId },
    });
    expect(removedReports!.items).toEqual([]);

    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [memberId] }] },
      path: { sessionId },
      throwOnError: true,
    });

    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
      throwOnError: true,
    });

    const { data: reaffected } = await member.members.listMemberSessionReports({
      path: { sessionId, userId: memberId },
    });
    const restoredReport = await member.reports.detailReport({
      path: { reportId: reaffected!.items[0]!.report.id },
    });
    expect(restoredReport.data!.state).toBe('IN_PROGRESS');
  });

  test('updating the priorities after a publication leaves the affectations published', async ({ agent, expect }) => {
    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId, reporterIds: [memberId] }] },
      path: { sessionId },
      throwOnError: true,
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId }, throwOnError: true });

    await agent.sessions.updateNominationFilesPriorities({
      body: { items: [{ nominationFileId, priorities: ['ETOILE'] }] },
      path: { sessionId },
      throwOnError: true,
    });

    const history = await agent.sessions.detailAffectationHistory({ path: { sessionId } });
    expect(history.data).toMatchObject({ lastPublished: { version: 1 }, pending: null });

    const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(files.data!.items[0]).toMatchObject({ priorities: ['ETOILE'], reporters: [{ id: memberId }] });
  });

  test('gives each file its own priorities in a single bulk update', async ({ agent, expect, sessions }) => {
    const candidate = (lastName: string) => ({
      firstName: 'ETIENNE',
      lastName,
      position: { function: seed.functions.PR, grade: 'G3' as const, jurisdiction: seed.jurisdictions['CA  LYON'] },
      targetPosition: {
        function: seed.functions.PR,
        grade: 'G3' as const,
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      },
    });
    const { id: bulkSessionId } = await sessions.createOne({
      candidates: [candidate('ARNAUD'), candidate('BERGER'), candidate('CARON')],
      createdAt: '22/04/2026',
      name: 'Transparence priorités groupées',
    });
    const { data } = await agent.sessions.listNominationFiles({ path: { sessionId: bulkSessionId } });
    const [first, second, third] = data!.items.map(({ id }) => id);

    await agent.sessions.updateNominationFilesPriorities({
      body: {
        items: [
          { nominationFileId: first!, priorities: ['ETOILE'] },
          { nominationFileId: second!, priorities: ['ETOILE'] },
          { nominationFileId: third!, priorities: ['PROFILE'] },
        ],
      },
      path: { sessionId: bulkSessionId },
      throwOnError: true,
    });

    const files = await agent.sessions.listNominationFiles({ path: { sessionId: bulkSessionId } });
    expect(new Map(files.data!.items.map(({ id, priorities }) => [id, priorities]))).toEqual(
      new Map([
        [first, ['ETOILE']],
        [second, ['ETOILE']],
        [third, ['PROFILE']],
      ]),
    );
  });
});
