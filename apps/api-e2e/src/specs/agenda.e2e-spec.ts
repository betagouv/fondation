import { test } from '../fixtures.ts';
import { type CreatedAgenda, MEETING_DATE } from '../fixtures/docs.fixture.ts';
import type { PaginatedNominationFiles } from '../generated/api/types.ts';
import type { TestStepsAgent } from '../steps.ts';

function statusOf(items: PaginatedNominationFiles['items'], nominationFileId: string) {
  return items.find(({ id }) => id === nominationFileId)?.content.status;
}

async function listedAgenda(agent: TestStepsAgent, { id: agendaId, sessionId }: CreatedAgenda) {
  const docs = await agent.docs.findSessionDocs({ path: { sessionId } });
  const found = docs.data!.items.find(({ id }) => id === agendaId);
  return found?.type === 'agenda' ? found : undefined;
}

const VALIDATED = { comment: null, value: 'VALIDATED' } as const;

test.describe('Agenda', () => {
  test('should plan a file listed in an agenda, and keep it planned until its official report is validated', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const sessionId = session.id;

    const foundFiles = await agent.docs.findAgendaNominationFiles({ path: { sessionId } });
    expect(foundFiles.data!.items).toHaveLength(2);

    const [plannedFile, untouchedFile] = session.files;

    const beforeAgenda = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(beforeAgenda.data!.items, plannedFile!.id)).toEqual({
      dates: [],
      value: 'TO_REPORT',
    });

    const agenda = await agent.docs.createAgenda({
      body: {
        chairmanId: docs.chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        nominationFileIds: [plannedFile!.id],
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
      },
      path: { sessionId },
    });
    expect(agenda.response?.status).toBe(201);

    const afterAgenda = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(afterAgenda.data!.items, plannedFile!.id)).toEqual({
      dates: [{ day: 10, month: 2, year: 2026 }],
      value: 'DSJ_PLANNED',
    });
    expect(statusOf(afterAgenda.data!.items, untouchedFile!.id)).toEqual({
      dates: [],
      value: 'TO_REPORT',
    });

    const todayDate = new Date();
    await docs.officialReport(
      { id: agenda.data!.id, sessionId },
      {
        sessionMeetingDate: {
          day: todayDate.getDate(),
          month: todayDate.getMonth() + 1,
          year: todayDate.getFullYear(),
        },
      },
    );

    const afterOfficialReport = await agent.sessions.listNominationFiles({ path: { sessionId } });
    expect(statusOf(afterOfficialReport.data!.items, plannedFile!.id)).toEqual({
      dates: [{ day: 10, month: 2, year: 2026 }],
      value: 'DSJ_PLANNED',
    });
  });

  test('should plan again a suspended file listed in a later agenda, whatever its outcome becomes', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({
      outcome: { comment: null, value: 'SUSPENDED' },
      reporters: [member['@user']!],
    });
    const sessionId = session.id;
    const [file] = session.files;

    const statusOfFile = async () => {
      const files = await agent.sessions.listNominationFiles({ path: { sessionId } });
      return statusOf(files.data!.items, file!.id);
    };

    const firstAgenda = await docs.agenda(session, { files: [file!] });
    expect(await statusOfFile()).toEqual({ dates: [MEETING_DATE], value: 'DSJ_PLANNED' });

    await docs.officialReport(firstAgenda, { status: 'VALIDATED' });
    expect(await statusOfFile()).toEqual({ dates: [MEETING_DATE], value: 'DSJ_REPORTED' });

    const laterMeetingDate = { day: 20, month: 2, year: 2026 };
    const laterAgenda = await docs.agenda(session, { files: [file!], sessionMeetingDate: laterMeetingDate });
    expect(await statusOfFile()).toEqual({ dates: [laterMeetingDate], value: 'DSJ_PLANNED' });

    await agent.sessions.defineNominationFileOutcome({
      body: { comment: null, outcome: 'VALIDATED' },
      path: { nominationFileId: file!.id, sessionId },
    });
    expect(await statusOfFile()).toEqual({ dates: [laterMeetingDate], value: 'DSJ_PLANNED' });

    await docs.officialReport(laterAgenda, { sessionMeetingDate: laterMeetingDate, status: 'VALIDATED' });
    expect(await statusOfFile()).toEqual({ dates: [laterMeetingDate], value: 'DSJ_REPORTED' });
  });

  test('should let an agenda be made from reporters not yet published, and say so', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session();
    const sessionId = session.id;
    const [file] = session.files;

    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId: file!.id, priorities: [], reporterIds: [member['@user']!.id] }] },
      path: { sessionId },
    });

    const readiness = await agent.docs.isSessionReadyForDocGeneration({ path: { sessionId } });
    expect(readiness.data).toMatchObject({
      agendaBlocker: null,
      agendaWarning: 'UNPUBLISHED_CHANGES',
      canCreateAgenda: true,
    });

    const agenda = await agent.docs.createAgenda({
      body: {
        chairmanId: docs.chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        nominationFileIds: [file!.id],
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
      },
      path: { sessionId },
    });
    expect(agenda.response?.status).toBe(201);
  });

  test('should forget a reporter removed since the last publication', async ({ agent, docs, expect, member }) => {
    const session = await docs.session();
    const sessionId = session.id;
    const [file] = session.files;

    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId: file!.id, priorities: [], reporterIds: [member['@user']!.id] }] },
      path: { sessionId },
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId: file!.id, priorities: [], reporterIds: [] }] },
      path: { sessionId },
    });

    const readiness = await agent.docs.isSessionReadyForDocGeneration({ path: { sessionId } });
    expect(readiness.data).toMatchObject({ agendaBlocker: 'NO_AFFECTATION', canCreateAgenda: false });
  });

  test('should keep an edition made after a validation, and undo it when the draft is discarded', async ({
    agent,
    docs,
    expect,
  }) => {
    const { id: agendaId } = await docs.agenda(await docs.session(), { status: 'VALIDATED' });

    const beforeEdition = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const block = beforeEdition.data!.blocks[0]!;
    expect(block.edited).toBe(false);

    // the block id names a row of the validated version: the edition forks a draft whose rows are
    // brand new, and it has to land there all the same
    const edited = await agent.docs.editAgendaFileBlock({
      body: { html: '<p>Une phrase écrite à la main</p>', outdated: false },
      path: { agendaId, fileId: block.id },
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
      body: { html: '<p>Une seconde écriture</p>', outdated: false },
      path: { agendaId, fileId: afterDiscard.data!.blocks[0]!.id },
    });
    expect(reEdited.response?.status).toBe(204);

    const revalidated = await agent.docs.validateAgenda({ path: { agendaId } });
    expect(revalidated.response?.status).toBe(204);

    const pdf = await agent.docs.generateAgendaPdf({ path: { agendaId } });
    expect(pdf.response?.status).toBe(200);

    const validatedBlocks = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    const [writtenBlock, otherBlock] = validatedBlocks.data!.blocks;
    await agent.docs.editAgendaFileBlock({
      body: { html: '<p>Une autre proposition</p>', outdated: false },
      path: { agendaId, fileId: otherBlock!.id },
    });

    const forked = await agent.docs.detailsAgendaDocumentBlocks({ path: { agendaId } });
    expect(forked.data!.blocks[0]).toMatchObject({ editedBy: writtenBlock!.editedBy });
    expect(writtenBlock!.editedBy).not.toBeNull();
  });

  test('should tell apart a draft the application opened from one a person works on', async ({
    agent,
    docs,
    expect,
    member,
    registerUser,
  }) => {
    const otherReporter = await registerUser('MEMBRE_DU_PARQUET');
    const session = await docs.session({ reporters: [member['@user']!] });
    const sessionId = session.id;

    const affect = async (reporterId: string) => {
      await agent.sessions.affectReporters({
        body: {
          items: session.files.map(({ id }) => ({
            nominationFileId: id,
            priorities: [],
            reporterIds: [reporterId],
          })),
        },
        path: { sessionId },
      });
      await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId } });
    };

    const { id: agendaId } = await docs.agenda(session, { status: 'VALIDATED' });

    const draftOf = async () => {
      const found = await agent.docs.findSessionDocs({ path: { sessionId } });
      return found.data!.items.find(({ id }) => id === agendaId)?.draftChangesBy;
    };
    expect(await draftOf()).toBeNull();

    // the new reporters land in a draft the application opens on its own
    await affect(otherReporter.id);
    expect(await draftOf()).toBe('SYSTEM');

    await agent.docs.validateAgenda({ path: { agendaId } });
    const edited = await agent.docs.updateAgendaMetadata({
      body: { chairmanId: docs.chairman.id, date: { day: 2, month: 2, year: 2026 }, sessionMeetingDate: MEETING_DATE },
      path: { agendaId },
    });
    expect(edited.response?.status).toBe(204);
    expect(await draftOf()).toBe('PERSON');

    await affect(member['@user']!.id);
    expect(await draftOf()).toBe('PERSON_AND_SYSTEM');
  });

  test('should not tell a change on a new agenda nobody edited', async ({ agent, docs, expect }) => {
    const agenda = await docs.agenda(await docs.session());

    expect(await listedAgenda(agent, agenda)).toMatchObject({ draftUpdate: null, status: 'DRAFT' });
  });

  test('should tell a validated agenda presented once the notice holding it is', async ({ agent, docs, expect }) => {
    const agenda = await docs.agenda(await docs.session(), { status: 'VALIDATED' });
    const { id: planId } = await docs.notice([agenda], { status: 'VALIDATED' });

    const beforePresentation = await listedAgenda(agent, agenda);
    expect(beforePresentation?.presentation).toEqual({ status: 'TO_PRESENT' });

    await agent.docs.presentPlan({ body: { endTime: { hours: 10, minutes: 15, seconds: 0 } }, path: { planId } });

    expect((await listedAgenda(agent, agenda))?.presentation).toEqual({
      // the agent who validated the agenda is the one presenting its notice
      by: beforePresentation?.validatedBy,
      date: MEETING_DATE,
      endTime: { hours: 10, minutes: 15, seconds: 0 },
      planId,
      status: 'PRESENTED',
    });
  });

  test('should bring an agenda back to present once its notice presentation is cancelled', async ({
    agent,
    docs,
    expect,
  }) => {
    const agenda = await docs.agenda(await docs.session(), { status: 'VALIDATED' });
    const { id: planId } = await docs.notice([agenda], { status: 'PRESENTED' });

    await agent.docs.unPresentPlan({ path: { planId } });

    expect((await listedAgenda(agent, agenda))?.presentation).toEqual({ status: 'TO_PRESENT' });
  });

  test('should keep the presentation of a validated agenda once a draft is opened on it', async ({
    agent,
    docs,
    expect,
  }) => {
    const agenda = await docs.agenda(await docs.session(), { status: 'VALIDATED' });
    await docs.notice([agenda], { status: 'PRESENTED' });

    await agent.docs.updateAgendaMetadata({
      body: { chairmanId: docs.chairman.id, date: { day: 2, month: 2, year: 2026 }, sessionMeetingDate: MEETING_DATE },
      path: { agendaId: agenda.id },
    });

    expect(await listedAgenda(agent, agenda)).toMatchObject({
      draftChangesBy: 'PERSON',
      presentation: { date: MEETING_DATE, endTime: { hours: 11, minutes: 0, seconds: 0 }, status: 'PRESENTED' },
    });
  });
});
