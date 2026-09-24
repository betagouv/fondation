import postgres from 'postgres';
import { inject } from 'vitest';

import { test } from '../fixtures.ts';
import type { PaginatedNominationFiles } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

async function filesOfValidatedVersionsReading(html: string): Promise<number> {
  const sql = postgres(inject('databaseUrl'), { onnotice: () => {} });

  try {
    const [row] = await sql<{ count: bigint }[]>`
      select count(*)
      from docs.official_report_nomination_file as f
      inner join docs.official_report_version as v on v.id = f.version_id
      where v.status = 'VALIDATED' and f.html_edited = ${html}
    `;

    return Number(row?.count ?? 0);
  } finally {
    await sql.end();
  }
}

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

  test('should tell each agenda what it lacks for its official report, until one can be made of it', async ({
    agent,
    expect,
    member,
  }) => {
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const [file] = foundFiles.data!.items;

    await agent.sessions.affectReporters({
      path: { sessionId },
      body: { items: [{ nominationFileId: file!.id, reporterIds: [member['@user']!.id], priorities: [] }] },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    await agent.sessions.defineNominationFileOutcome({
      path: { sessionId, nominationFileId: file!.id },
      body: { comment: null, outcome: 'ASSESSING' },
    });

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [file!.id],
      },
    });
    const readinessOf = async () => {
      const docs = await agent.docs.findSessionDocs({ path: { sessionId } });
      const found = docs.data!.items.find(({ id }) => id === agenda.data!.id);
      return found?.type === 'agenda' ? found.officialReportReadiness : undefined;
    };

    expect(await readinessOf()).toEqual({
      filesWithoutOutcome: 1,
      filesWithoutReporter: 0,
      filesWithUnpublishedReporter: 0,
      status: 'INCOMPLETE',
    });

    await agent.sessions.defineNominationFileOutcome({
      path: { sessionId, nominationFileId: file!.id },
      body: { comment: null, outcome: 'VALIDATED' },
    });

    expect(await readinessOf()).toEqual({ status: 'READY' });

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
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      },
    });
    expect(officialReport.response?.status).toBe(201);
    expect(await readinessOf()).toBeNull();
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

    const validatedBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [writtenBlock, otherBlock] = validatedBlocks.data!.blocks;
    await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: otherBlock!.id },
      body: { html: '<p>Une autre proposition</p>', outdated: false },
    });

    const forked = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    expect(forked.data!.blocks[0]).toMatchObject({ editedBy: writtenBlock!.editedBy });
    expect(writtenBlock!.editedBy).not.toBeNull();
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
    const taken = afterAgendaMovedOn
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(taken).toMatchObject({ edited: true, fromAgenda: true, html: later, outdated: false });
  });

  test('should rewrite the draft of a validated report, not the version it no longer touches', async ({
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
    const nominationFileId = firstBlock!.nominationFileId!;

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
    const officialReportId = created.data!.id;

    const validated = await agent.docs.validateOfficialReport({ path: { officialReportId } });
    expect(validated.response?.status).toBe(204);

    const later = `<strong>MME HANNAH ARENDT</strong>, réécrite après la validation du procès-verbal.`;
    await agent.docs.editAgendaFileBlock({
      path: { agendaId, fileId: firstBlock!.id },
      body: { html: later, outdated: false },
    });
    await agent.docs.validateAgenda({ path: { agendaId } });

    const afterAgendaMovedOn = await agent.docs.detailsOfficialReportDocument({
      path: { officialReportId },
    });
    const taken = afterAgendaMovedOn
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === nominationFileId);

    expect(taken).toMatchObject({ fromAgenda: true, html: later, outdated: false });

    const metadata = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(metadata.data!.draft).toMatchObject({ openedBy: null, systemCauses: ['AGENDA_TEXT'] });

    // the validated version is what the readers still see: nothing may land on it
    expect(await filesOfValidatedVersionsReading(later)).toBe(0);
  });

  test('should delete a validated agenda and its notice, with the pdfs they hold', async ({
    agent,
    expect,
    member,
    registerUser,
  }) => {
    // the notice refuses a formation whose only present member presides it
    await registerUser('MEMBRE_DU_PARQUET');

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

    await agent.docs.validateAgenda({ path: { agendaId } });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const plan = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agendaId }],
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    const planId = plan.data!.id;

    await agent.docs.generatePresentationPlanHtml({ path: { planId } });
    await agent.docs.validatePresentationPlan({ path: { planId } });

    const deletedPlan = await agent.docs.deleteJusticePresentationPlan({ path: { planId } });
    expect(deletedPlan.response?.status).toBe(204);

    const deletedAgenda = await agent.docs.deleteAgenda({ path: { agendaId } });
    expect(deletedAgenda.response?.status).toBe(204);
  });

  test('should drop the notice pdf that no longer says what the notice says', async ({
    agent,
    expect,
    registerUser,
  }) => {
    // the notice refuses a formation whose only present member presides it
    await registerUser('MEMBRE_DU_PARQUET');

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
        nominationFileIds: foundFiles.data!.items.map(({ id }) => id),
      },
    });
    expect(agenda.response?.status).toBe(201);

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });

    const plan = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agenda.data!.id }],
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    expect(plan.response?.status).toBe(201);

    const planId = plan.data!.id;

    // the notice holds no text until it is read, and the pdf has none without it
    const rendered = await agent.docs.generatePresentationPlanHtml({ path: { planId } });
    expect(rendered.response?.status).toBe(200);

    await agent.docs.validatePresentationPlan({ path: { planId } });

    const before = await agent.docs.detailsJusticePresentationPlanPdfDocument({ path: { planId } });
    expect(before.response?.status).toBe(200);

    const rewritten = '<html><body><p>Le garde des Sceaux renonce au délai.</p></body></html>';
    const edited = await agent.docs.updatePresentationPlanHtml({
      path: { planId },
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
    });
    expect(edited.response?.status).toBe(204);

    const dropped = await agent.docs.detailsJusticePresentationPlanPdfDocument({ path: { planId } });
    expect(dropped.response?.status).toBe(404);

    await agent.docs.validatePresentationPlan({ path: { planId } });

    const after = await agent.docs.detailsJusticePresentationPlanPdfDocument({ path: { planId } });
    expect(after.data!.url).not.toBe(before.data!.url);
  });

  test('should tell a notice that its agenda no longer says what it copied', async ({
    agent,
    expect,
    member,
    registerUser,
  }) => {
    await registerUser('MEMBRE_DU_PARQUET');

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundFiles.data!.items).toHaveLength(2);

    await agent.sessions.affectReporters({
      path: { sessionId },
      body: {
        items: foundFiles.data!.items.map(({ id }) => ({
          nominationFileId: id,
          reporterIds: [member['@user']!.id],
          priorities: [],
        })),
      },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });

    for (const { id } of foundFiles.data!.items) {
      await agent.sessions.defineNominationFileOutcome({
        path: { sessionId, nominationFileId: id },
        body: { comment: null, outcome: 'VALIDATED' },
      });
    }

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
        nominationFileIds: foundFiles.data!.items.map(({ id }) => id),
      },
    });
    const agendaId = agenda.data!.id;
    await agent.docs.validateAgenda({ path: { agendaId } });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const planBody = {
      absentMembers: [],
      agendas: [{ comment: null, id: agendaId }],
      chairmanId,
      date: MEETING_DATE,
      hasRenunciation: true,
      justiceContactId: justiceContact.data!.id,
      secretaryId: firstSecretaryId,
      time: { hours: 9, minutes: 30, seconds: 0 },
    };

    const plan = await agent.docs.createJusticePresentationPlan({ body: planBody });
    const planId = plan.data!.id;
    await agent.docs.generatePresentationPlanHtml({ path: { planId } });

    const atWriting = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atWriting.data!.outdated).toBe(false);

    const [keptFile] = foundFiles.data!.items;
    const dropped = await agent.docs.updateAgendaFiles({
      path: { agendaId },
      body: { nominationFileIds: [keptFile!.id] },
    });
    expect(dropped.response?.status).toBe(204);

    // the draft is not yet the agenda the notice answers to, so nothing has changed for it
    const atDraft = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atDraft.data!.outdated).toBe(false);

    await agent.docs.validateAgenda({ path: { agendaId } });

    const atValidation = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atValidation.data!.outdated).toBe(true);

    const rewritten = await agent.docs.updateJusticePresentationPlan({ path: { planId }, body: planBody });
    expect(rewritten.response?.status).toBe(204);

    const atRewriting = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atRewriting.data!.outdated).toBe(false);
  });

  test('should refuse to restitute a notice nobody validated', async ({ agent, expect, registerUser }) => {
    // the notice refuses a formation whose only present member presides it
    await registerUser('MEMBRE_DU_PARQUET');

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: MEETING_DATE,
        nominationFileIds: foundFiles.data!.items.map(({ id }) => id),
      },
    });

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const plan = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agenda.data!.id }],
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    const planId = plan.data!.id;

    const created = await agent.docs.listNonPresentedPlans();
    expect(created.data!.items.find(({ id }) => id === planId)?.status).toBe('DRAFT');

    await agent.docs.generatePresentationPlanHtml({ path: { planId } });

    const listed = await agent.docs.listNonPresentedPlans();
    const written = listed.data!.items.find(({ id }) => id === planId);
    expect(written?.status).toBe('DRAFT');
    expect(written?.createdBy?.name).toEqual(expect.any(String));
    // reading the notice wrote its html, and that is the application's doing, not an edition
    expect(written?.updatedAt).toBeNull();
    expect(written?.updatedBy).toBeNull();

    const refused = await agent.docs.presentPlan({
      path: { planId },
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
    });
    expect(refused.response?.status).toBe(400);

    await agent.docs.validatePresentationPlan({ path: { planId } });

    const validated = await agent.docs.listNonPresentedPlans();
    const ready = validated.data!.items.find(({ id }) => id === planId);
    expect(ready?.status).toBe('VALIDATED');
    // validating settles the notice, it does not rewrite it
    expect(ready?.updatedAt).toBeNull();

    const validatedMetadata = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(validatedMetadata.data!.validation).toEqual({ at: expect.any(String), by: ready?.createdBy });

    const rewritten = '<html><body><p>Le garde des Sceaux renonce au délai.</p></body></html>';
    await agent.docs.updatePresentationPlanHtml({
      path: { planId },
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
    });

    const edited = await agent.docs.listNonPresentedPlans();
    const afterEdition = edited.data!.items.find(({ id }) => id === planId);
    expect(afterEdition?.updatedAt).toEqual(expect.any(String));
    expect(afterEdition?.updatedBy?.id).toBe(afterEdition?.createdBy?.id);

    await agent.docs.validatePresentationPlan({ path: { planId } });

    const presented = await agent.docs.presentPlan({
      path: { planId },
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
    });
    expect(presented.response?.status).toBe(204);

    const presentedMetadata = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(presentedMetadata.data!.presentation).toEqual({ at: expect.any(String), by: ready?.createdBy });

    // presenting twice would append a second ending time to the text and its pdf
    const presentedAgain = await agent.docs.presentPlan({
      path: { planId },
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
    });
    expect(presentedAgain.response?.status).toBe(400);

    const rewrittenAfterPresentation = await agent.docs.updatePresentationPlanHtml({
      path: { planId },
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
    });
    expect(rewrittenAfterPresentation.response?.status).toBe(400);

    const reverted = await agent.docs.resetPresentationPlanDocument({ path: { planId } });
    expect(reverted.response?.status).toBe(400);

    const updated = await agent.docs.updateJusticePresentationPlan({
      path: { planId },
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agenda.data!.id }],
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    expect(updated.response?.status).toBe(400);

    const stillPresented = await agent.docs.listPresentedPlans();
    expect(stillPresented.data!.items.find(({ id }) => id === planId)).toBeDefined();
  });

  test('should let the notice validated first take the agendas it shares with the drafts', async ({
    agent,
    expect,
    registerUser,
  }) => {
    await registerUser('MEMBRE_DU_PARQUET');

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const [firstFile, secondFile] = foundFiles.data!.items;

    const createAgenda = async (nominationFileId: string) => {
      const agenda = await agent.docs.createAgenda({
        path: { sessionId },
        body: {
          chairmanId,
          date: { day: 1, month: 2, year: 2026 },
          nominationFileIds: [nominationFileId],
          sessionMeetingDate: MEETING_DATE,
        },
      });
      return agenda.data!.id;
    };
    const firstAgendaId = await createAgenda(firstFile!.id);
    const secondAgendaId = await createAgenda(secondFile!.id);

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const createPlan = async (agendaIds: string[]) => {
      const plan = await agent.docs.createJusticePresentationPlan({
        body: {
          absentMembers: [],
          agendas: agendaIds.map((id) => ({ comment: null, id })),
          chairmanId,
          date: MEETING_DATE,
          hasRenunciation: true,
          justiceContactId: justiceContact.data!.id,
          secretaryId: firstSecretaryId,
          time: { hours: 9, minutes: 30, seconds: 0 },
        },
      });
      expect(plan.response?.status).toBe(201);
      return plan.data!.id;
    };
    const validate = async (planId: string) => {
      await agent.docs.generatePresentationPlanHtml({ path: { planId } });
      await agent.docs.validatePresentationPlan({ path: { planId } });
    };

    const sharingPlanId = await createPlan([firstAgendaId, secondAgendaId]);
    const firstPlanId = await createPlan([firstAgendaId]);
    const secondPlanId = await createPlan([secondAgendaId]);

    await validate(firstPlanId);

    const awaiting = await agent.docs.listPresentationPlanAgendas();
    const awaitingIds = awaiting.data!.items.map(({ id }) => id);
    expect(awaitingIds).not.toContain(firstAgendaId);
    expect(awaitingIds).toContain(secondAgendaId);

    const sharing = await agent.docs.detailsPresentationPlanMetadata({ path: { planId: sharingPlanId } });
    expect(sharing.data!.agendas.map(({ id }) => id)).toEqual([secondAgendaId]);
    expect(sharing.data!.removedAgendas).toEqual([
      expect.objectContaining({ takenBy: expect.objectContaining({ id: firstPlanId }) }),
    ]);

    const listed = await agent.docs.listNonPresentedPlans();
    const hasRemovedAgendas = (planId: string) => listed.data!.items.find(({ id }) => id === planId)?.hasRemovedAgendas;
    expect(hasRemovedAgendas(sharingPlanId)).toBe(true);
    expect(hasRemovedAgendas(firstPlanId)).toBe(false);

    const taken = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: firstAgendaId }],
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    expect(taken.response?.status).toBe(404);

    // left without any agenda, the draft has nothing more to say
    await validate(secondPlanId);

    const emptied = await agent.docs.detailsPresentationPlanMetadata({ path: { planId: sharingPlanId } });
    expect(emptied.response?.status).toBe(404);
  });

  test('should delete every notice of a deleted agenda, whatever other agenda they hold', async ({
    agent,
    expect,
    registerUser,
  }) => {
    await registerUser('MEMBRE_DU_PARQUET');

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    const agendaIds = await Promise.all(
      foundFiles.data!.items.map(async ({ id }) => {
        const agenda = await agent.docs.createAgenda({
          path: { sessionId },
          body: {
            chairmanId,
            date: { day: 1, month: 2, year: 2026 },
            nominationFileIds: [id],
            sessionMeetingDate: MEETING_DATE,
          },
        });
        return agenda.data!.id;
      }),
    );
    const [deletedAgendaId, keptAgendaId] = agendaIds;

    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const plan = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: agendaIds.map((id) => ({ comment: null, id })),
        chairmanId,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.data!.id,
        secretaryId: firstSecretaryId,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
    });
    const planId = plan.data!.id;

    const deleted = await agent.docs.deleteAgenda({ path: { agendaId: deletedAgendaId! } });
    expect(deleted.response?.status).toBe(204);

    const gone = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(gone.response?.status).toBe(404);

    const awaiting = await agent.docs.listPresentationPlanAgendas();
    expect(awaiting.data!.items.map(({ id }) => id)).toContain(keptAgendaId);
  });

  test('should tell apart a draft the application opened from one a person works on', async ({
    agent,
    expect,
    member,
    registerUser,
  }) => {
    const otherReporter = await registerUser('MEMBRE_DU_PARQUET');
    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });

    const affect = async (reporterId: string) => {
      await agent.sessions.affectReporters({
        path: { sessionId },
        body: {
          items: foundFiles.data!.items.map(({ id }) => ({
            nominationFileId: id,
            priorities: [],
            reporterIds: [reporterId],
          })),
        },
      });
      await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    };
    await affect(member['@user']!.id);

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        nominationFileIds: foundFiles.data!.items.map(({ id }) => id),
        sessionMeetingDate: MEETING_DATE,
      },
    });
    const agendaId = agenda.data!.id;
    await agent.docs.validateAgenda({ path: { agendaId } });

    const draftOf = async () => {
      const docs = await agent.docs.findSessionDocs({ path: { sessionId } });
      return docs.data!.items.find(({ id }) => id === agendaId)?.draftChangesBy;
    };
    expect(await draftOf()).toBeNull();

    // the new reporters land in a draft the application opens on its own
    await affect(otherReporter.id);
    expect(await draftOf()).toBe('SYSTEM');

    await agent.docs.validateAgenda({ path: { agendaId } });
    const edited = await agent.docs.updateAgendaMetadata({
      path: { agendaId },
      body: { chairmanId, date: { day: 2, month: 2, year: 2026 }, sessionMeetingDate: MEETING_DATE },
    });
    expect(edited.response?.status).toBe(204);
    expect(await draftOf()).toBe('PERSON');

    await affect(member['@user']!.id);
    expect(await draftOf()).toBe('PERSON_AND_SYSTEM');
  });

  test('should tell a person changing the metadata of a validated official report', async ({
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
          priorities: [],
          reporterIds: [member['@user']!.id],
        })),
      },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    for (const nominationFileId of nominationFileIds) {
      await agent.sessions.defineNominationFileOutcome({
        path: { nominationFileId, sessionId },
        body: { comment: null, outcome: 'VALIDATED' },
      });
    }

    const agenda = await agent.docs.createAgenda({
      path: { sessionId },
      body: {
        chairmanId,
        date: { day: 1, month: 2, year: 2026 },
        nominationFileIds,
        sessionMeetingDate: MEETING_DATE,
      },
    });
    const justiceContact = await agent.docs.createJusticeContact({
      body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    });
    const metadata = {
      absentMemberIds: [],
      chairmanId,
      hasRenunciation: true,
      justiceDepartmentContactId: justiceContact.data!.id,
      secretaryId: firstSecretaryId,
      sessionMeetingDate: MEETING_DATE,
      sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
    };
    const created = await agent.docs.createOfficialReport({
      path: { sessionId },
      body: { ...metadata, agendas: [agenda.data!.id] },
    });
    const officialReportId = created.data!.id;
    await agent.docs.validateOfficialReport({ path: { officialReportId } });

    const updated = await agent.docs.updateOfficialReport({
      path: { officialReportId },
      body: { ...metadata, hasRenunciation: false },
    });
    expect(updated.response?.status).toBe(204);

    const details = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(details.data).toMatchObject({ draftChangesBy: 'PERSON', status: 'DRAFT' });

    // the draft the application opens later on starts from the validated version, not from its traces
    await agent.docs.updateOfficialReport({ path: { officialReportId }, body: metadata });
    await agent.docs.validateOfficialReport({ path: { officialReportId } });
    await agent.docs.updateAgendaMetadata({
      path: { agendaId: agenda.data!.id },
      body: { chairmanId, date: { day: 3, month: 2, year: 2026 }, sessionMeetingDate: MEETING_DATE },
    });

    const reopened = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(reopened.data).toMatchObject({ draftChangesBy: 'SYSTEM', status: 'DRAFT' });
  });
});
