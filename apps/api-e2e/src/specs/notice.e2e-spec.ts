import { test } from '../fixtures.ts';
import { MEETING_DATE } from '../fixtures/docs.fixture.ts';

const VALIDATED = { comment: null, value: 'VALIDATED' } as const;

test.describe('Notice', () => {
  test('should delete a validated agenda and its notice, with the pdfs they hold', async ({
    agent,
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session, { status: 'VALIDATED' });
    const plan = await docs.notice([agenda], { status: 'VALIDATED' });

    const deletedPlan = await agent.docs.deleteJusticePresentationPlan({ path: { planId: plan.id } });
    expect(deletedPlan.response?.status).toBe(204);

    const deletedAgenda = await agent.docs.deleteAgenda({ path: { agendaId: agenda.id } });
    expect(deletedAgenda.response?.status).toBe(204);
  });

  test('should drop the notice pdf that no longer says what the notice says', async ({ agent, docs, expect }) => {
    const agenda = await docs.agenda(await docs.session());
    const { id: planId } = await docs.notice([agenda], { status: 'VALIDATED' });

    const before = await agent.docs.detailsJusticePresentationPlanPdfDocument({ path: { planId } });
    expect(before.response?.status).toBe(200);

    const rewritten = '<html><body><p>Le garde des Sceaux renonce au délai.</p></body></html>';
    const edited = await agent.docs.updatePresentationPlanHtml({
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
      path: { planId },
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
    docs,
    expect,
    member,
  }) => {
    const session = await docs.session({ outcome: VALIDATED, reporters: [member['@user']!] });
    const agenda = await docs.agenda(session, { status: 'VALIDATED' });
    const agendaId = agenda.id;

    const { id: planId } = await docs.notice([agenda]);
    await agent.docs.generatePresentationPlanHtml({ path: { planId } });

    const atWriting = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atWriting.data!.outdated).toBe(false);

    const [keptFile] = session.files;
    const dropped = await agent.docs.updateAgendaFiles({
      body: { nominationFileIds: [keptFile!.id] },
      path: { agendaId },
    });
    expect(dropped.response?.status).toBe(204);

    // the draft is not yet the agenda the notice answers to, so nothing has changed for it
    const atDraft = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atDraft.data!.outdated).toBe(false);

    await agent.docs.validateAgenda({ path: { agendaId } });

    const atValidation = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atValidation.data!.outdated).toBe(true);

    const rewritten = await agent.docs.updateJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agendaId }],
        chairmanId: docs.chairman.id,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: docs.justiceContact.id,
        secretaryId: docs.secretary.id,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
      path: { planId },
    });
    expect(rewritten.response?.status).toBe(204);

    const atRewriting = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(atRewriting.data!.outdated).toBe(false);
  });

  test('should refuse to restitute a notice nobody validated', async ({ agent, docs, expect }) => {
    const agenda = await docs.agenda(await docs.session());
    const { id: planId } = await docs.notice([agenda]);

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
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
      path: { planId },
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
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
      path: { planId },
    });

    const edited = await agent.docs.listNonPresentedPlans();
    const afterEdition = edited.data!.items.find(({ id }) => id === planId);
    expect(afterEdition?.updatedAt).toEqual(expect.any(String));
    expect(afterEdition?.updatedBy?.id).toBe(afterEdition?.createdBy?.id);

    await agent.docs.validatePresentationPlan({ path: { planId } });

    const presented = await agent.docs.presentPlan({
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
      path: { planId },
    });
    expect(presented.response?.status).toBe(204);

    const presentedMetadata = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(presentedMetadata.data!.presentation).toEqual({
      by: ready?.createdBy,
      date: MEETING_DATE,
      endTime: { hours: 11, minutes: 0, seconds: 0 },
    });

    // presenting twice would append a second ending time to the text and its pdf
    const presentedAgain = await agent.docs.presentPlan({
      body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
      path: { planId },
    });
    expect(presentedAgain.response?.status).toBe(400);

    const rewrittenAfterPresentation = await agent.docs.updatePresentationPlanHtml({
      body: { html: new File([rewritten], 'notice.html', { type: 'text/html' }) },
      path: { planId },
    });
    expect(rewrittenAfterPresentation.response?.status).toBe(400);

    const reverted = await agent.docs.resetPresentationPlanDocument({ path: { planId } });
    expect(reverted.response?.status).toBe(400);

    const updated = await agent.docs.updateJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: [{ comment: null, id: agenda.id }],
        chairmanId: docs.chairman.id,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: docs.justiceContact.id,
        secretaryId: docs.secretary.id,
        time: { hours: 9, minutes: 30, seconds: 0 },
      },
      path: { planId },
    });
    expect(updated.response?.status).toBe(400);

    const stillPresented = await agent.docs.listPresentedPlans();
    expect(stillPresented.data!.items.find(({ id }) => id === planId)).toBeDefined();
  });

  test('should keep a validated notice as it is when it is saved unchanged', async ({ agent, docs, expect }) => {
    const agenda = await docs.agenda(await docs.session());
    const metadata = {
      absentMembers: [],
      chairmanId: docs.chairman.id,
      date: MEETING_DATE,
      hasRenunciation: true,
      justiceContactId: docs.justiceContact.id,
      secretaryId: docs.secretary.id,
      time: { hours: 9, minutes: 30, seconds: 0 },
    };
    const { id: planId } = await docs.notice([agenda], { ...metadata, status: 'VALIDATED' });

    const saved = await agent.docs.updateJusticePresentationPlan({
      body: { ...metadata, agendas: [{ comment: null, id: agenda.id }] },
      path: { planId },
    });
    expect(saved.response?.status).toBe(204);

    const listed = await agent.docs.listNonPresentedPlans();
    expect(listed.data!.items.find(({ id }) => id === planId)).toMatchObject({
      status: 'VALIDATED',
      updatedAt: null,
    });
  });

  test('should let the notice validated first take the agendas it shares with the drafts', async ({
    agent,
    docs,
    expect,
  }) => {
    const session = await docs.session();
    const [firstFile, secondFile] = session.files;
    const firstAgenda = await docs.agenda(session, { files: [firstFile!] });
    const secondAgenda = await docs.agenda(session, { files: [secondFile!] });

    const validate = async (planId: string) => {
      await agent.docs.generatePresentationPlanHtml({ path: { planId } });
      await agent.docs.validatePresentationPlan({ path: { planId } });
    };

    const { id: sharingPlanId } = await docs.notice([firstAgenda, secondAgenda]);
    const { id: firstPlanId } = await docs.notice([firstAgenda]);
    const { id: secondPlanId } = await docs.notice([secondAgenda]);

    await validate(firstPlanId);

    const awaiting = await agent.docs.listPresentationPlanAgendas();
    const awaitingIds = awaiting.data!.items.map(({ id }) => id);
    expect(awaitingIds).not.toContain(firstAgenda.id);
    expect(awaitingIds).toContain(secondAgenda.id);

    const sharing = await agent.docs.detailsPresentationPlanMetadata({ path: { planId: sharingPlanId } });
    expect(sharing.data!.agendas.map(({ id }) => id)).toEqual([secondAgenda.id]);
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
        agendas: [{ comment: null, id: firstAgenda.id }],
        chairmanId: docs.chairman.id,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: docs.justiceContact.id,
        secretaryId: docs.secretary.id,
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
    docs,
    expect,
  }) => {
    const session = await docs.session();
    const [deletedAgenda, keptAgenda] = await Promise.all(
      session.files.map((file) => docs.agenda(session, { files: [file] })),
    );
    const { id: planId } = await docs.notice([deletedAgenda!, keptAgenda!]);

    const deleted = await agent.docs.deleteAgenda({ path: { agendaId: deletedAgenda!.id } });
    expect(deleted.response?.status).toBe(204);

    const gone = await agent.docs.detailsPresentationPlanMetadata({ path: { planId } });
    expect(gone.response?.status).toBe(404);

    const awaiting = await agent.docs.listPresentationPlanAgendas();
    expect(awaiting.data!.items.map(({ id }) => id)).toContain(keptAgenda!.id);
  });
});
