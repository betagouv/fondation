import { test } from '../fixtures.ts';
import type { PaginatedNominationFiles } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

function statusOf(items: PaginatedNominationFiles['items'], nominationFileId: string) {
  return items.find(({ id }) => id === nominationFileId)?.content.status;
}

test.describe('Docs Service', () => {
  let chairmanId: string;
  let firstSecretaryId: string;
  let sessionId: string;

  test.beforeEach(async ({ admin, agent, sessions, registerUser, expect }) => {
    const chairman = await registerUser('MEMBRE_DU_PARQUET');

    const titleUpdateResponse = await agent.members.updateTitle({
      path: { userId: chairman.id },
      body: { title: 'PRESIDENT_PARQUET' },
    });
    expect(titleUpdateResponse.response?.status).toBe(204);

    chairmanId = chairman.id;

    const firstSecretary = await registerUser('ADJOINT_SECRETAIRE_GENERAL');
    const roleUpdated = await admin.administration.updateRole({
      path: { userId: firstSecretary.id },
      body: { role: 'FIRST_SECRETARY' },
    });
    expect(roleUpdated.response?.status).toBe(204);
    firstSecretaryId = firstSecretary.id;

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
            grade: 'G3',
          },
          targetPosition: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  REIMS'],
            grade: 'G3',
          },
        },
        {
          firstName: 'HANNAH',
          lastName: 'ARENDT',
          civilite: 'MME',
          position: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            grade: 'G3',
          },
          targetPosition: {
            function: seed.functions.PR,
            jurisdiction: seed.jurisdictions['CA  LYON'],
            grade: 'G3',
          },
        },
      ],
    });
    sessionId = session.id;

    const validateRes = await agent.sessions.validateSession({ path: { sessionId } });
    expect(validateRes.response?.status).toBe(204);

    const publishRes = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
    });
    expect(publishRes.response?.status).toBe(204);
  });

  test('should plan a file listed in an agenda, and keep it planned until its official report is validated', async ({
    agent,
    expect,
    member,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundFiles.data!.items).toHaveLength(2);

    const affectationRes = await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: foundFiles.data!.items.map(({ id }) => ({
          nominationFileId: id,
          reporterIds: [member['@user']!.id],
          priorities: [],
        })),
      },
    });
    expect(affectationRes.response?.status).toBe(204);

    const publicationRes = await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId },
    });
    expect(publicationRes.response?.status).toBe(204);

    for (const { id } of foundFiles.data!.items) {
      const outcomeRes = await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId: id },
        body: { comment: null, outcome: 'VALIDATED' },
      });
      expect(outcomeRes.response?.status).toBe(204);
    }

    const [plannedFile, untouchedFile] = foundFiles.data!.items;

    const beforeAgenda = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(beforeAgenda.data!.items, plannedFile!.id)).toEqual({
      value: 'TO_REPORT',
      date: null,
    });

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [plannedFile!.id],
      },
    });
    expect(agenda.response?.status).toBe(201);

    const afterAgenda = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(afterAgenda.data!.items, plannedFile!.id)).toEqual({
      value: 'DSJ_PLANNED',
      date: { day: 10, month: 2, year: 2026 },
    });
    expect(statusOf(afterAgenda.data!.items, untouchedFile!.id)).toEqual({
      value: 'TO_REPORT',
      date: null,
    });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const todayDate = new Date();

    const officialReport = await agent.docs.createOfficialReport({
      path: { sessionId },
      body: {
        chairmanId,
        absentMemberIds: [],
        agendas: [agenda.data!.id],
        hasRenunciation: true,
        justiceDepartmentContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        sessionMeetingDate: {
          day: todayDate.getDate(),
          month: todayDate.getMonth() + 1,
          year: todayDate.getFullYear(),
        },
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      },
    });
    expect(officialReport.response?.status).toBe(201);

    const afterOfficialReport = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(afterOfficialReport.data!.items, plannedFile!.id)).toEqual({
      value: 'DSJ_PLANNED',
      date: { day: 10, month: 2, year: 2026 },
    });
  });

  test('should prevent creating an agenda with a file appearing as VALIDATED in official report', async ({
    agent,
    expect,
    member,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundFiles.response?.status).toBe(200);
    expect(foundFiles.data!.items).toHaveLength(2);

    const memberId = member['@user']!.id;
    const affectationRes = await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: (foundFiles.data?.items ?? []).map(({ id }) => ({
          nominationFileId: id,
          reporterIds: [memberId],
          priorities: [],
        })),
      },
    });
    expect(affectationRes.response?.status).toBe(204);

    const publicationRes = await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    expect(publicationRes.response?.status).toBe(204);

    for (const { id } of foundFiles.data!.items) {
      const outcomeRes = await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId: id },
        body: { comment: null, outcome: 'VALIDATED' },
      });
      expect(outcomeRes.response?.status).toBe(204);
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
    expect(agenda.response?.status).toBe(201);
    expect(agenda.data).toEqual({ id: expect.any(String) });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    expect(justiceContact.response?.status).toBe(201);

    const todayDate = new Date();
    const today = { day: todayDate.getDate(), month: todayDate.getMonth() + 1, year: todayDate.getFullYear() };

    const firstOfficialReport = await agent.docs.createOfficialReport({
      path: { sessionId },
      body: {
        chairmanId,
        absentMemberIds: [],
        agendas: [agenda.data!.id],
        hasRenunciation: true,
        justiceDepartmentContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        sessionMeetingDate: today,
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      },
    });
    expect(firstOfficialReport.response?.status).toBe(201);

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
    expect(duplicateAgenda.response?.status).toBe(400);
  });
});
