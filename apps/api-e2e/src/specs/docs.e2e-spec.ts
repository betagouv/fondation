import { test } from '../fixtures.ts';
import type { PaginatedNominationFiles } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

function statusOf(items: PaginatedNominationFiles['items'], nominationFileId: string) {
  return items.find(({ id }) => id === nominationFileId)?.content.status;
}

const MEETING_DATE = { day: 10, month: 2, year: 2026 } as const;

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
      dates: [],
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
      dates: [{ day: 10, month: 2, year: 2026 }],
    });
    expect(statusOf(afterAgenda.data!.items, untouchedFile!.id)).toEqual({
      value: 'TO_REPORT',
      dates: [],
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
      dates: [{ day: 10, month: 2, year: 2026 }],
    });
  });

  test('should report the session only once every file is acted in a validated official report', async ({
    agent,
    expect,
    member,
  }) => {
    const ruleAcrossEndpoints = async () => {
      const sessions = await agent.sessions.listSessionsOfTypeGardeDesSceaux({ query: { limit: 50 } });
      const detailed = await agent.sessions.detailsNominationSession({ path: { sessionId } });
      const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const readiness = await agent.docs.isSessionReadyForDocGeneration({ path: { sessionId } });

      return {
        agendaBlocker: readiness.data!.agendaBlocker,
        isArchivable: detailed.data!.isArchivable,
        lockedReasons: files.data!.items.map(({ content }) => content.lockedReason),
        status: sessions.data!.items.find(({ id }) => id === sessionId)?.status,
      };
    };

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const fileIds = foundFiles.data!.items.map(({ id }) => id);
    expect(fileIds).toHaveLength(2);

    await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: fileIds.map((nominationFileId) => ({
          nominationFileId,
          reporterIds: [member['@user']!.id],
          priorities: [],
        })),
      },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });

    for (const nominationFileId of fileIds) {
      await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId },
        body: { comment: null, outcome: 'VALIDATED' },
      });
    }

    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: null,
      isArchivable: false,
      lockedReasons: [null, null],
      status: 'READY',
    });

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
        nominationFileIds: fileIds,
      },
    });
    expect(agenda.response?.status).toBe(201);

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });

    const officialReport = await agent.docs.createOfficialReport({
      path: { sessionId },
      body: {
        chairmanId,
        absentMemberIds: [],
        agendas: [agenda.data!.id],
        hasRenunciation: true,
        justiceDepartmentContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        sessionMeetingDate: MEETING_DATE,
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      },
    });
    expect(officialReport.response?.status).toBe(201);

    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: null,
      isArchivable: false,
      lockedReasons: [null, null],
      status: 'READY',
    });

    const validated = await agent.docs.validateOfficialReport({
      path: { officialReportId: officialReport.data!.id },
    });
    expect(validated.response?.status).toBe(204);

    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: 'ALL_FILES_REPORTED',
      isArchivable: true,
      lockedReasons: ['REPORTED', 'REPORTED'],
      status: 'REPORTED',
    });

    const archived = await agent.sessions.archiveSession({ path: { sessionId } });
    expect(archived.response?.status).toBe(204);
  });
});
