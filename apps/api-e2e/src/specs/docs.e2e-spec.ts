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

  test('should keep an edition made after a validation, and undo it when the draft is discarded', async ({
    agent,
    expect,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const nominationFileIds = foundFiles.data!.items.map(({ id }) => id);

    const created = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        nominationFileIds,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
      },
    });
    expect(created.response?.status).toBe(201);
    const agendaId = created.data!.id;

    const validated = await agent.docs.validateAgenda({ path: { agendaId } });
    expect(validated.response?.status).toBe(204);

    const beforeEdition = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const block = beforeEdition.data!.blocks[0]!;
    expect(block.edited).toBe(false);

    // the block id names a row of the validated version: the edition forks a draft whose rows are
    // brand new, and it has to land there all the same
    const edited = await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: block.id },
      body: { html: '<p>Une phrase écrite à la main</p>', outdated: false },
    });
    expect(edited.response?.status).toBe(204);

    const afterEdition = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    expect(afterEdition.data!.blocks[0]).toMatchObject({
      edited: true,
      html: '<p>Une phrase écrite à la main</p>',
    });

    const metadata = await agent.docs.detailsAgendaMetadata({ path: { agendaId } });
    expect(metadata.data).toMatchObject({ hasValidatedVersion: true, status: 'DRAFT' });

    const discarded = await agent.docs.discardAgendaDraft({ path: { agendaId } });
    expect(discarded.response?.status).toBe(204);

    const afterDiscard = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    expect(afterDiscard.data!.blocks[0]).toMatchObject({ edited: false, html: block.html });

    // a second validation renders a PDF while dropping the version it replaces: a path shared by
    // both versions would have the drop delete the object just written, and the file would 404
    const reEdited = await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: afterDiscard.data!.blocks[0]!.id },
      body: { html: '<p>Une seconde écriture</p>', outdated: false },
    });
    expect(reEdited.response?.status).toBe(204);

    const revalidated = await agent.docs.validateAgenda({ path: { agendaId } });
    expect(revalidated.response?.status).toBe(204);

    const pdf = await agent.docs.generateAgendaPdf({ path: { agendaId } });
    expect(pdf.response?.status).toBe(200);
  });

  test('should keep an official report edition made after a validation, and undo it when discarded', async ({
    agent,
    expect,
    member,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const nominationFileIds = foundFiles.data!.items.map(({ id }) => id);

    // a report is only ever made from an agenda whose files are all decided and reported on
    await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: nominationFileIds.map((nominationFileId) => ({
          nominationFileId,
          reporterIds: [member['@user']!.id],
          priorities: [],
        })),
      },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });

    for (const nominationFileId of nominationFileIds) {
      await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId },
        body: { comment: null, outcome: 'VALIDATED' },
      });
    }

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        nominationFileIds,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
      },
    });
    expect(agenda.response?.status).toBe(201);

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });

    const created = await agent.docs.createOfficialReport({
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
    expect(created.response?.status).toBe(201);
    const officialReportId = created.data!.id;

    const validated = await agent.docs.validateOfficialReport({ path: { officialReportId } });
    expect(validated.response?.status).toBe(204);

    const beforeEdition = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(beforeEdition.data).toMatchObject({ hasValidatedVersion: true, status: 'VALIDATED' });

    // the edition forks a draft whose rows are brand new, and it has to land there all the same
    const edited = await agent.docs.editOfficialReportIntro({
      path: { officialReportId },
      body: { html: '<p>Une introduction écrite à la main</p>', outdated: false },
    });
    expect(edited.response?.status).toBe(204);

    const afterEdition = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(afterEdition.data).toMatchObject({ hasValidatedVersion: true, status: 'DRAFT' });

    const discarded = await agent.docs.discardOfficialReportDraft({ path: { officialReportId } });
    expect(discarded.response?.status).toBe(204);

    const afterDiscard = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(afterDiscard.data).toMatchObject({ hasValidatedVersion: true, status: 'VALIDATED' });
  });

  test('should take a block written by hand in the agenda, and say the agenda wrote it', async ({
    agent,
    expect,
    member,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const nominationFileIds = foundFiles.data!.items.map(({ id }) => id);

    await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: nominationFileIds.map((nominationFileId) => ({
          nominationFileId,
          reporterIds: [member['@user']!.id],
          priorities: [],
        })),
      },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });

    for (const nominationFileId of nominationFileIds) {
      await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId },
        body: { comment: null, outcome: 'VALIDATED' },
      });
    }

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        nominationFileIds,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
      },
    });
    const agendaId = agenda.data!.id;

    const agendaBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [firstBlock] = agendaBlocks.data!.blocks;

    const html = `<strong>MME HANNAH ARENDT</strong>, réécrite à la main dans l'ordre du jour.`;
    const editedBlock = await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: firstBlock!.id },
      body: { html, outdated: false },
    });
    expect(editedBlock.response?.status).toBe(204);

    await agent.docs.validateAgenda({ path: { agendaId } });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const created = await agent.docs.createOfficialReport({
      path: { sessionId },
      body: {
        chairmanId,
        absentMemberIds: [],
        agendas: [agendaId],
        hasRenunciation: true,
        justiceDepartmentContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        sessionMeetingDate: MEETING_DATE,
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      },
    });
    expect(created.response?.status).toBe(201);

    const reportBlocks = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId: created.data!.id },
    });
    const carried = reportBlocks
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(carried).toMatchObject({ edited: true, fromAgenda: true, html });
    expect(carried!.editedAt).not.toBeNull();

    const rewritten = `<p>${html} Complété dans le PV.</p>`;
    await agent.docs.editOfficialReportFile({
      path: { officialReportId: created.data!.id, nominationFileId: firstBlock!.nominationFileId! },
      body: { html: rewritten, outdated: false },
    });

    const afterEdition = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId: created.data!.id },
    });
    const own = afterEdition
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(own).toMatchObject({ edited: true, fromAgenda: false, html: rewritten });
    expect(own!.editedAt).not.toBeNull();

    // the agenda is corrected afterwards. Its draft says nothing to the report, its validation does
    const later = `<strong>MME HANNAH ARENDT</strong>, corrigée dans l'ordre du jour après coup.`;
    await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: firstBlock!.id },
      body: { html: later, outdated: false },
    });

    const whileAgendaDrafts = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId: created.data!.id },
    });
    const untouched = whileAgendaDrafts
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(untouched).toMatchObject({ agendaHtml: html, outdated: false });

    await agent.docs.validateAgenda({ path: { agendaId } });

    const afterAgendaMovedOn = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId: created.data!.id },
    });
    const warned = afterAgendaMovedOn
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(warned).toMatchObject({ agendaHtml: later, html: rewritten, outdated: true });

    await agent.docs.resetOfficialReportFile({
      path: { officialReportId: created.data!.id, nominationFileId: firstBlock!.nominationFileId! },
    });

    const afterAccepting = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId: created.data!.id },
    });
    const accepted = afterAccepting
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(accepted).toMatchObject({ edited: true, fromAgenda: true, html: later, outdated: false });
  });
});
