import type { Sql } from 'postgres';

import { test } from '../fixtures.ts';
import { MEETING_DATE } from '../fixtures/docs.fixture.ts';

async function filesOfValidatedVersionsReading(sql: Sql, html: string): Promise<number> {
  const [row] = await sql<{ count: bigint }[]>`
    select count(*)
    from docs.official_report_nomination_file as f
    inner join docs.official_report_version as v on v.id = f.version_id
    where v.status = 'VALIDATED' and f.html_edited = ${html}
  `;

  return Number(row?.count ?? 0);
}

const VALIDATED = { comment: null, value: 'VALIDATED' } as const;

test.describe('Official report', () => {
  test('should tell each agenda what it lacks for its official report, until one can be made of it', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ reporters: [member['@user']!] });
    const sessionId = session.id;
    const [file] = session.files;

    const agenda = await docs.agenda(session, { files: [file!] });
    const readinessOf = async () => {
      const found = await agent.docs.findSessionDocs({ path: { sessionId } });
      const listed = found.data!.items.find(({ id }) => id === agenda.id);
      return listed?.type === 'agenda' ? listed.officialReportReadiness : undefined;
    };

    expect(await readinessOf()).toEqual({
      filesWithoutOutcome: 1,
      filesWithoutReporter: 0,
      filesWithUnpublishedReporter: 0,
      status: 'INCOMPLETE',
    });

    await agent.sessions.defineNominationFileOutcome({
      body: { comment: null, outcome: 'VALIDATED' },
      path: { nominationFileId: file!.id, sessionId },
    });

    expect(await readinessOf()).toEqual({ status: 'READY' });

    await docs.officialReport(agenda);
    expect(await readinessOf()).toBeNull();
  });

  test('should report the session only once every file is acted in a validated official report', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const sessionId = session.id;

    const ruleAcrossEndpoints = async () => {
      const sessions = await agent.sessions.listSessionsOfTypeGardeDesSceaux({ query: { search: session.name } });
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

    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: null,
      isArchivable: false,
      lockedReasons: [null, null],
      status: 'READY',
    });

    const agenda = await docs.agenda(session);
    const officialReport = await docs.officialReport(agenda);

    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: null,
      isArchivable: false,
      lockedReasons: [null, null],
      status: 'READY',
    });

    const validated = await agent.docs.validateOfficialReport({ path: { officialReportId: officialReport.id } });
    expect(validated.response?.status).toBe(204);

    // the files stay open to another agenda until a notice presents them
    expect(await ruleAcrossEndpoints()).toEqual({
      agendaBlocker: null,
      isArchivable: true,
      lockedReasons: ['REPORTED', 'REPORTED'],
      status: 'REPORTED',
    });

    await agent.docs.validateAgenda({ path: { agendaId: agenda.id } });
    await docs.notice([agenda], { status: 'PRESENTED' });

    expect((await ruleAcrossEndpoints()).agendaBlocker).toBe('ALL_FILES_REPORTED');

    const reports = await member.members.listMemberSessionReports({
      path: { sessionId, userId: member['@user']!.id },
    });
    const archived = await agent.sessions.archiveSession({ path: { sessionId } });
    expect(archived.response?.status).toBe(204);
    const archivedSessions = await agent.archivedSessions.listArchivedSessions({ query: { search: session.name } });
    expect(archivedSessions.data!.items.map(({ id }) => id)).toContain(sessionId);

    // an archived session freezes the reports written for it
    const frozen = await member.reports.updateReport({
      body: { comment: 'Relu après la session' },
      path: { reportId: reports.data!.items[0]!.report.id },
    });
    expect(frozen.response?.status).toBe(403);
  });

  test('should list an archived session to the members of its formation only', async ({
    agent,
    docs,
    expect,
    logIn,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const sessionId = session.id;
    await docs.officialReport(await docs.agenda(session), { status: 'VALIDATED' });
    await agent.sessions.archiveSession({ path: { sessionId }, throwOnError: true });

    const archivedSessions = await agent.archivedSessions.listArchivedSessions({ query: { search: session.name } });
    const archivedSession = archivedSessions.data!.items.find(({ id }) => id === sessionId);
    expect(archivedSession).toMatchObject({
      archivedAt: expect.any(String),
      proposingAuthority: { id: 'GARDE_DES_SCEAUX', label: 'Garde des Sceaux' },
      typeDeSaisine: { id: 'TRANSPARENCE_GDS', label: 'Transparence' },
    });

    const { formation } = archivedSession!;
    const formationMember = await logIn(formation === 'PARQUET' ? 'MEMBRE_DU_PARQUET' : 'MEMBRE_DU_SIEGE');
    const outsider = await logIn(formation === 'PARQUET' ? 'MEMBRE_DU_SIEGE' : 'MEMBRE_DU_PARQUET');
    const foundByMember = await formationMember.archivedSessions.listArchivedSessions({
      query: { search: session.name },
    });
    expect(foundByMember.data!.items.map(({ id }) => id)).toContain(sessionId);
    const foundByOutsider = await outsider.archivedSessions.listArchivedSessions({
      query: { formations: [formation], search: session.name },
    });
    expect(foundByOutsider.data!.items.map(({ id }) => id)).not.toContain(sessionId);
  });

  test('should freeze the summaries of the files of an archived session', async ({ agent, docs, expect, member }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    await docs.officialReport(await docs.agenda(session), { status: 'VALIDATED' });
    const summaryPath = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    await agent.summaries.createSummary({ path: summaryPath, throwOnError: true });
    await agent.summaries.writeSummary({
      body: { content: '<p>Synthèse avant archivage</p>' },
      path: summaryPath,
      throwOnError: true,
    });
    await agent.sessions.archiveSession({ path: { sessionId: session.id }, throwOnError: true });

    const frozen = await agent.summaries.writeSummary({
      body: { content: '<p>Synthèse après archivage</p>' },
      path: summaryPath,
    });
    expect(frozen.response?.status).toBe(403);
    const summary = await agent.summaries.detailSummary({ path: summaryPath });
    expect(summary.data?.summary.content).toBe('<p>Synthèse avant archivage</p>');
  });

  test('should list an agenda for a new official report with the date and times of its validated notice', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    const noticeDate = { day: 11, month: 2, year: 2026 };
    await docs.notice([agenda], { date: noticeDate, status: 'PRESENTED' });

    const listed = await agent.docs.listAgendasForNewOfficialReport({ path: { sessionId: session.id } });
    expect(listed.data!.items.find(({ id }) => id === agenda.id)?.presentationPlan).toEqual(
      expect.objectContaining({
        date: noticeDate,
        endTime: { hours: 11, minutes: 0, seconds: 0 },
        startTime: { hours: 9, minutes: 30, seconds: 0 },
      }),
    );
  });

  test('should not tell a change on a new official report nobody edited', async ({ agent, docs, expect, member }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const { id: officialReportId } = await docs.officialReport(await docs.agenda(session));

    const found = await agent.docs.findSessionDocs({ path: { sessionId: session.id } });
    expect(found.data!.items.find(({ id }) => id === officialReportId)).toMatchObject({
      draftUpdate: null,
      status: 'DRAFT',
    });
  });

  test('should keep an official report edition made after a validation, and undo it when discarded', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    // a report is only ever made from an agenda whose files are all decided and reported on
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const { id: officialReportId } = await docs.officialReport(await docs.agenda(session), { status: 'VALIDATED' });

    const beforeEdition = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(beforeEdition.data).toMatchObject({ hasValidatedVersion: true, status: 'VALIDATED' });

    // the edition forks a draft whose rows are brand new, and it has to land there all the same
    const edited = await agent.docs.editOfficialReportIntro({
      body: { html: '<p>Une introduction écrite à la main</p>', outdated: false },
      path: { officialReportId },
    });
    expect(edited.response?.status).toBe(204);

    const afterEdition = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(afterEdition.data).toMatchObject({ hasValidatedVersion: true, status: 'DRAFT' });

    const discarded = await agent.docs.discardOfficialReportDraft({ path: { officialReportId } });
    expect(discarded.response?.status).toBe(204);

    const afterDiscard = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(afterDiscard.data).toMatchObject({ hasValidatedVersion: true, status: 'VALIDATED' });
  });

  test('should give back the generated text of each part reset after a validation, and the written text when the draft is discarded', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const { id: officialReportId } = await docs.officialReport(await docs.agenda(session));
    const path = { officialReportId };
    const sectionPath = { officialReportId, outcome: 'VALIDATED' } as const;

    const partsOf = async () => {
      const document = await agent.docs.detailsOfficialReportDocument({ path });
      return document.data!.blocks.filter(({ kind }) => kind !== 'file');
    };
    const generated = await partsOf();

    await agent.docs.editOfficialReportIntro({ body: { html: '<p>Introduction écrite</p>', outdated: false }, path });
    await agent.docs.editOfficialReportConclusion({
      body: { html: '<p>Conclusion écrite</p>', outdated: false },
      path,
    });
    await agent.docs.editOfficialReportSectionTitle({ body: { text: 'Titre écrit' }, path: sectionPath });
    await agent.docs.editOfficialReportSectionIntro({ body: { html: '<p>Section écrite</p>' }, path: sectionPath });
    await agent.docs.validateOfficialReport({ path });

    // the first reset forks a draft whose rows are brand new, and the others have to land there all the same
    await agent.docs.resetOfficialReportIntro({ path });
    await agent.docs.resetOfficialReportConclusion({ path });
    await agent.docs.resetOfficialReportSectionTitle({ path: sectionPath });
    await agent.docs.resetOfficialReportSectionIntro({ path: sectionPath });

    expect(await partsOf()).toEqual(generated);
    const reset = await agent.docs.detailsOfficialReport({ path });
    expect(reset.data).toMatchObject({ hasValidatedVersion: true, status: 'DRAFT' });

    await agent.docs.discardOfficialReportDraft({ path });

    expect(await partsOf()).toMatchObject([
      { edited: true, html: '<p>Introduction écrite</p>', kind: 'intro' },
      { edited: true, kind: 'section-title', text: 'Titre écrit' },
      { edited: true, html: '<p>Section écrite</p>', kind: 'section-intro' },
      { edited: true, html: '<p>Conclusion écrite</p>', kind: 'conclusion' },
    ]);
  });

  test('should take a block written by hand in the agenda, and say the agenda wrote it', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    const agendaId = agenda.id;

    const agendaBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [firstBlock] = agendaBlocks.data!.blocks;

    const html = `<strong>MME HANNAH ARENDT</strong>, réécrite à la main dans l'ordre du jour.`;
    const editedBlock = await agent.docs.editAgendaFileBlock({
      body: { html, outdated: false },
      path: { agendaId, fileId: firstBlock!.id },
    });
    expect(editedBlock.response?.status).toBe(204);

    await agent.docs.validateAgenda({ path: { agendaId } });

    const { id: officialReportId } = await docs.officialReport(agenda);

    const reportBlocks = await agent.docs.detailsOfficialReportDocument({ path: { officialReportId } });
    const carried = reportBlocks
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(carried).toMatchObject({ edited: true, fromAgenda: true, html });
    expect(carried!.editedAt).not.toBeNull();

    // the agenda is corrected afterwards. Its draft says nothing to the report, its validation does
    const later = `<strong>MME HANNAH ARENDT</strong>, corrigée dans l'ordre du jour après coup.`;
    await agent.docs.editAgendaFileBlock({
      body: { html: later, outdated: false },
      path: { agendaId, fileId: firstBlock!.id },
    });

    const whileAgendaDrafts = await agent.docs.detailsOfficialReportDocument({ path: { officialReportId } });
    const untouched = whileAgendaDrafts
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(untouched).toMatchObject({ agendaHtml: html, outdated: false });

    await agent.docs.validateAgenda({ path: { agendaId } });

    const afterAgendaMovedOn = await agent.docs.detailsOfficialReportDocument({ path: { officialReportId } });
    const taken = afterAgendaMovedOn
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);

    expect(taken).toMatchObject({ edited: true, fromAgenda: true, html: later, outdated: false });
  });

  test('should keep a validated report as it is when the agenda rewrites a proposition', async ({
    agent,
    docs,
    expect,
    member,
    sql,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    const agendaId = agenda.id;

    const agendaBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [firstBlock] = agendaBlocks.data!.blocks;

    await agent.docs.validateAgenda({ path: { agendaId } });

    const { id: officialReportId } = await docs.officialReport(agenda, { status: 'VALIDATED' });

    const later = `<strong>MME HANNAH ARENDT</strong>, réécrite après la validation du procès-verbal.`;
    await agent.docs.editAgendaFileBlock({
      body: { html: later, outdated: false },
      path: { agendaId, fileId: firstBlock!.id },
    });
    await agent.docs.validateAgenda({ path: { agendaId } });

    const metadata = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(metadata.data).toMatchObject({
      changedSinceValidation: ['AGENDA_TEXT'],
      draft: null,
      status: 'VALIDATED',
    });
    expect(await filesOfValidatedVersionsReading(sql, later)).toBe(0);
  });

  test('should give a file of a validated report the sentence its agenda rewrote, once reset', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session, { status: 'VALIDATED' });
    const agendaId = agenda.id;
    const { id: officialReportId } = await docs.officialReport(agenda, { status: 'VALIDATED' });

    const agendaBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [firstBlock] = agendaBlocks.data!.blocks;

    const later = `<strong>MME HANNAH ARENDT</strong>, réécrite après la validation du procès-verbal.`;
    await agent.docs.editAgendaFileBlock({
      body: { html: later, outdated: false },
      path: { agendaId, fileId: firstBlock!.id },
    });
    await agent.docs.validateAgenda({ path: { agendaId } });

    const reset = await agent.docs.resetOfficialReportFile({
      path: { nominationFileId: firstBlock!.nominationFileId!, officialReportId },
    });
    expect(reset.response?.status).toBe(204);

    const metadata = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(metadata.data).toMatchObject({ hasValidatedVersion: true, status: 'DRAFT' });

    const document = await agent.docs.detailsOfficialReportDocument({ path: { officialReportId } });
    const taken = document
      .data!.blocks.filter((block) => block.kind === 'file')
      .find((block) => block.nominationFileId === firstBlock!.nominationFileId);
    expect(taken).toMatchObject({ fromAgenda: true, html: later, outdated: false });
  });

  test('should refuse a second official report of an agenda', async ({ agent, docs, expect, member }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    await docs.officialReport(agenda);

    const second = await agent.docs.createOfficialReport({
      body: {
        absentMemberIds: [],
        agendaId: agenda.id,
        chairmanId: docs.chairman.id,
        hasRenunciation: true,
        justiceDepartmentContactId: docs.justiceContact.id,
        secretaryId: docs.secretary.id,
        sessionMeetingDate: MEETING_DATE,
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
      },
      path: { sessionId: session.id },
    });
    expect(second.response?.status).toBe(404);
  });

  test('should free the agenda of a deleted official report for a new one', async ({ agent, docs, expect, member }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const sessionId = session.id;
    const [file] = session.files;
    const agenda = await docs.agenda(session, { status: 'VALIDATED' });
    const { id: officialReportId } = await docs.officialReport(agenda, { status: 'VALIDATED' });

    const freeAgendaIds = async () => {
      const found = await agent.docs.listAgendasForNewOfficialReport({ path: { sessionId } });
      return found.data!.items.map(({ id }) => id);
    };
    const statusOfFile = async () => {
      const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
      return files.data!.items.find(({ id }) => id === file!.id)?.content.status.value;
    };

    expect(await freeAgendaIds()).not.toContain(agenda.id);
    expect(await statusOfFile()).toBe('DSJ_REPORTED');

    const deleted = await agent.docs.deleteOfficialReport({ path: { officialReportId } });
    expect(deleted.response?.status).toBe(204);

    expect(await freeAgendaIds()).toContain(agenda.id);
    expect(await statusOfFile()).toBe('DSJ_PLANNED');

    await docs.officialReport(agenda);
  });

  test('should tell a person changing the metadata of a validated official report', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    // a report is only ever made from an agenda whose files are all decided and reported on
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    const metadata = {
      absentMemberIds: [],
      chairmanId: docs.chairman.id,
      hasRenunciation: true,
      justiceDepartmentContactId: docs.justiceContact.id,
      secretaryId: docs.secretary.id,
      sessionMeetingDate: MEETING_DATE,
      sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
    };
    const { id: officialReportId } = await docs.officialReport(agenda, { ...metadata, status: 'VALIDATED' });

    const updated = await agent.docs.updateOfficialReport({
      body: { ...metadata, hasRenunciation: false },
      path: { officialReportId },
    });
    expect(updated.response?.status).toBe(204);

    const details = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(details.data).toMatchObject({ draftChangesBy: 'PERSON', status: 'DRAFT' });

    await agent.docs.updateOfficialReport({ body: metadata, path: { officialReportId } });
    await agent.docs.validateOfficialReport({ path: { officialReportId } });
    await agent.docs.updateAgendaMetadata({
      body: { chairmanId: docs.chairman.id, date: { day: 3, month: 2, year: 2026 }, sessionMeetingDate: MEETING_DATE },
      path: { agendaId: agenda.id },
    });

    const kept = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(kept.data).toMatchObject({
      changedSinceValidation: ['AGENDA_DATE'],
      draftChangesBy: null,
      status: 'VALIDATED',
    });

    // the person reopening it to set things right still needs to know why
    await agent.docs.updateOfficialReport({
      body: { ...metadata, hasRenunciation: false },
      path: { officialReportId },
    });
    const reopened = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(reopened.data).toMatchObject({ changedSinceValidation: ['AGENDA_DATE'], status: 'DRAFT' });
  });

  test('should keep a validated official report as it is when its metadata are saved unchanged', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const metadata = {
      absentMemberIds: [],
      chairmanId: docs.chairman.id,
      hasRenunciation: true,
      justiceDepartmentContactId: docs.justiceContact.id,
      secretaryId: docs.secretary.id,
      sessionMeetingDate: MEETING_DATE,
      sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
    };
    const { id: officialReportId } = await docs.officialReport(await docs.agenda(session), {
      ...metadata,
      status: 'VALIDATED',
    });

    const saved = await agent.docs.updateOfficialReport({ body: metadata, path: { officialReportId } });
    expect(saved.response?.status).toBe(204);

    const details = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(details.data).toMatchObject({ draftChangesBy: null, status: 'VALIDATED' });

    const found = await agent.docs.findSessionDocs({ path: { sessionId: session.id } });
    expect(found.data!.items.find(({ id }) => id === officialReportId)).toMatchObject({
      draftChangesBy: null,
      draftUpdate: null,
      status: 'VALIDATED',
    });
  });

  test('should keep in a validated official report a member deactivated since, with the absence recorded', async ({
    admin,
    agent,
    docs,
    expect,
    member,
    registerUser,
  }) => {
    const leaving = await registerUser('MEMBRE_DU_PARQUET');
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const metadata = {
      absentMemberIds: [],
      chairmanId: docs.chairman.id,
      hasRenunciation: true,
      justiceDepartmentContactId: docs.justiceContact.id,
      secretaryId: docs.secretary.id,
      sessionMeetingDate: MEETING_DATE,
      sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
    };
    const { id: officialReportId } = await docs.officialReport(await docs.agenda(session), {
      ...metadata,
      absentMemberIds: [leaving.id],
      status: 'VALIDATED',
    });
    await admin.administration.deactivate({ path: { userId: leaving.id }, throwOnError: true });

    const saved = await agent.docs.updateOfficialReport({ body: metadata, path: { officialReportId } });
    expect(saved.response?.status).toBe(204);

    const details = await agent.docs.detailsOfficialReport({ path: { officialReportId } });
    expect(details.data).toMatchObject({ draftChangesBy: null, status: 'VALIDATED' });
  });

  test('should render the official report draft again once its metadata change', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session);
    const secondContact = await agent.docs.createJusticeContact({
      body: { name: `Mme Claire Fontaine, adjointe ${crypto.randomUUID()}` },
    });
    const metadata = {
      absentMemberIds: [],
      chairmanId: docs.chairman.id,
      hasRenunciation: true,
      justiceDepartmentContactId: docs.justiceContact.id,
      secretaryId: docs.secretary.id,
      sessionMeetingDate: MEETING_DATE,
      sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
      sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
    };
    const { id: officialReportId } = await docs.officialReport(agenda, metadata);
    await agent.docs.generateOfficialReportHtml({ parseAs: 'text', path: { officialReportId } });

    await agent.docs.updateOfficialReport({
      body: { ...metadata, justiceDepartmentContactId: secondContact.data!.id },
      path: { officialReportId },
    });

    const rendered = await agent.docs.generateOfficialReportHtml({
      parseAs: 'text',
      path: { officialReportId },
    });
    expect(rendered.data).toContain(secondContact.data!.name);
    expect(rendered.data).not.toContain(docs.justiceContact.name);
  });
});
