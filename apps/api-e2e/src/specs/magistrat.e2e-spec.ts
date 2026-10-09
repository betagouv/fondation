import * as crypto from 'node:crypto';

import type { LolfiArchiveContent } from 'lolfi';
import { parse } from 'node-xlsx';

import { test as base } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import { makeFile } from '../utils/files.ts';
import * as seed from '../utils/seed.ts';

const VALROSE_SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      civilite: 'MME',
      firstName: 'HONORINE',
      lastName: 'VALROSE',
      marriedName: 'DUBOIS',
      phone: '06.12.34.56.78',
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
    {
      firstName: 'GERTRUDE',
      lastName: 'MONTFERRAND',
      position: {
        function: seed.functions.PR,
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  AMIENS'],
      },
      targetPosition: {
        function: seed.functions.PG,
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  MONTPELLIER'],
      },
    },
  ],
  createdAt: '22/04/2026',
  name: 'Transparence annuelle',
};

function observationForm(form: CreateObservationDto['form']): CreateObservationDto['form'] {
  return new Blob([JSON.stringify(form)], {
    type: 'application/json',
  }) as unknown as CreateObservationDto['form'];
}

const test = base.extend('valrose', async ({ agent, sessions }) => {
  const session = await sessions.createOne(VALROSE_SESSION);

  const nominationFiles = await agent.sessions
    .listNominationFiles({ path: { sessionId: session.id }, throwOnError: true })
    .then(({ data }) => data!.items);
  const nominationFile = nominationFiles.find((file) => /valrose/i.test(file.content.nomMagistrat));
  const otherNominationFile = nominationFiles.find((file) => !/valrose/i.test(file.content.nomMagistrat));

  return {
    magistratId: nominationFile!.content.detectedMagistratId!,
    nominationFile: nominationFile!,
    otherNominationFile: otherNominationFile!,
    session,
  };
});

test.describe('Magistrat E2E', () => {
  test('should detail a magistrat', async ({ agent, expect, valrose }) => {
    const details = await agent.magistrats.detailMagistrat({
      path: { magistratId: valrose.magistratId },
    });

    expect(details.response?.status).toBe(200);
    expect(details.data).toMatchObject({
      currentPosition: {
        function: { label: expect.any(String) },
        id: expect.any(Number),
        jurisdiction: { id: expect.any(String) },
      },
      externalUrl: expect.any(String),
      firstName: expect.stringMatching(/^honorine$/i),
      id: valrose.magistratId,
      lastName: expect.stringMatching(/^valrose$/i),
      name: 'Mme\u00A0VALROSE\u00A0Honorine (ép. DUBOIS)',
    });
  });

  test('should list the LOLFI phone numbers of a magistrat', async ({ agent, expect, valrose }) => {
    const phoneNumbers = await agent.magistrats.listMagistratPhoneNumbers({
      path: { magistratId: valrose.magistratId },
    });

    expect(phoneNumbers.response?.status).toBe(200);
    expect(phoneNumbers.data).toEqual({
      items: [{ date: { year: 2026, month: 4, day: 22 }, number: '06.12.34.56.78', source: 'LOLFI' }],
    });
  });

  test('should list the saved phone numbers before the LOLFI ones', async ({ agent, expect, valrose }) => {
    const today = { day: expect.any(Number), month: expect.any(Number), year: expect.any(Number) };
    const lolfi = { date: { year: 2026, month: 4, day: 22 }, number: '06.12.34.56.78', source: 'LOLFI' };
    const { data: me } = await agent.auth.introspectSession();
    const savedBy = { id: me!.userId, name: expect.any(String) };

    await agent.magistrats.addMagistratPhoneNumber({
      body: { label: 'Domicile', number: '01 23 45 67 89' },
      path: { magistratId: valrose.magistratId },
      throwOnError: true,
    });
    const withHome = await agent.magistrats.listMagistratPhoneNumbers({
      path: { magistratId: valrose.magistratId },
    });
    expect(withHome.data!.items).toEqual([
      { date: today, id: expect.any(String), label: 'Domicile', number: '0123456789', savedBy, source: 'FONDATION' },
      lolfi,
    ]);

    await agent.magistrats.addMagistratPhoneNumber({
      body: { label: null, number: '+33 6 12 34 56 78' },
      path: { magistratId: valrose.magistratId },
      throwOnError: true,
    });
    const withMobile = await agent.magistrats.listMagistratPhoneNumbers({
      path: { magistratId: valrose.magistratId },
    });
    expect(withMobile.data!.items).toEqual([
      { date: today, id: expect.any(String), label: null, number: '0612345678', savedBy, source: 'FONDATION' },
      { date: today, id: expect.any(String), label: 'Domicile', number: '0123456789', savedBy, source: 'FONDATION' },
    ]);
  });

  test('should update then delete a saved phone number', async ({ agent, expect, valrose }) => {
    const path = { magistratId: valrose.magistratId };
    await agent.magistrats.addMagistratPhoneNumber({
      body: { label: 'Portable', number: '07 00 00 00 00' },
      path,
      throwOnError: true,
    });
    const added = await agent.magistrats.listMagistratPhoneNumbers({ path, throwOnError: true });
    const phoneNumberId = added.data.items.find((phoneNumber) => phoneNumber.source === 'FONDATION')!.id;

    await agent.magistrats.updateMagistratPhoneNumber({
      body: { label: 'Conjointe', number: '07 11 11 11 11' },
      path: { ...path, phoneNumberId },
      throwOnError: true,
    });
    const updated = await agent.magistrats.listMagistratPhoneNumbers({ path, throwOnError: true });
    expect(updated.data.items[0]).toMatchObject({ id: phoneNumberId, label: 'Conjointe', number: '0711111111' });

    const deleted = await agent.magistrats.deleteMagistratPhoneNumber({ path: { ...path, phoneNumberId } });
    expect(deleted.response?.status).toBe(204);
    const remaining = await agent.magistrats.listMagistratPhoneNumbers({ path, throwOnError: true });
    expect(remaining.data.items).toEqual([
      { date: { year: 2026, month: 4, day: 22 }, number: '06.12.34.56.78', source: 'LOLFI' },
    ]);
  });

  test('should keep the saved phone numbers when LOLFI is ingested again', async ({ agent, expect, sessions }) => {
    // the same LOLFI ids make the second ingestion update the magistrat instead of creating another one
    const candidate = { ...VALROSE_SESSION.candidates[0]!, id: crypto.randomInt(1_000, 900_000) };
    const lolfiSession = { ...VALROSE_SESSION, candidates: [candidate], id: crypto.randomInt(1_000, 900_000) };
    const session = await sessions.createOne(lolfiSession);
    const [nominationFile] = await agent.sessions
      .listNominationFiles({ path: { sessionId: session.id }, throwOnError: true })
      .then(({ data }) => data!.items);
    const path = { magistratId: nominationFile!.content.detectedMagistratId! };

    await agent.magistrats.addMagistratPhoneNumber({
      body: { label: 'Conjointe', number: '07 00 00 00 00' },
      path,
      throwOnError: true,
    });
    await sessions.createOne({ ...lolfiSession, candidates: [{ ...candidate, phone: '06 98 76 54 32' }] });

    const phoneNumbers = await agent.magistrats.listMagistratPhoneNumbers({ path, throwOnError: true });
    expect(phoneNumbers.data.items).toEqual([
      {
        date: expect.any(Object),
        id: expect.any(String),
        label: 'Conjointe',
        number: '0700000000',
        savedBy: expect.any(Object),
        source: 'FONDATION',
      },
      { date: { year: 2026, month: 4, day: 22 }, number: '06 98 76 54 32', source: 'LOLFI' },
    ]);
  });

  test('should list the nomination files of a magistrat', async ({ agent, expect, member, valrose }) => {
    await agent.sessions.updateNominationFileAuditionDate({
      body: {
        auditionDate: { day: 15, month: 9, year: 2026 },
        auditionTime: { hours: 14, minutes: 30 },
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const nominationFiles = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.magistratId },
    });
    expect(nominationFiles.response?.status).toBe(200);
    expect(nominationFiles.data).toMatchObject({ currentPageIndex: 1, totalCount: 1 });
    expect(nominationFiles.data!.items[0]).toMatchObject({
      auditionDate: { day: 15, month: 9, year: 2026 },
      auditionRequired: true,
      auditionTime: { hours: 14, minutes: 30 },
      canScheduleAudition: true,
      id: valrose.nominationFile.id,
      outcome: null,
      session: { id: valrose.session.id, status: 'ONGOING' },
      targetedGrade: 'G3',
    });

    const memberNominationFiles = await api.magistrats.listMagistratNominationFiles({
      client: member['@client'],
      path: { magistratId: valrose.magistratId },
    });
    expect(memberNominationFiles.response?.status).toBe(200);
    expect(memberNominationFiles.data!.items[0]).toMatchObject({ id: valrose.nominationFile.id });
  });

  test('should expect an audition on an auditioned position', async ({ agent, expect, valrose }) => {
    const nominationFiles = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.otherNominationFile.content.detectedMagistratId! },
    });

    expect(nominationFiles.response?.status).toBe(200);
    expect(nominationFiles.data!.items[0]).toMatchObject({
      auditionRequired: true,
      canScheduleAudition: true,
    });
  });

  test('should no longer schedule an audition once the outcome is final', async ({ agent, expect, valrose }) => {
    const outcomeRes = await agent.sessions.defineNominationFileOutcome({
      body: { comment: null, outcome: 'VALIDATED' },
      path: { nominationFileId: valrose.otherNominationFile.id, sessionId: valrose.session.id },
    });
    expect(outcomeRes.response?.status).toBe(204);

    const nominationFiles = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.otherNominationFile.content.detectedMagistratId! },
    });

    expect(nominationFiles.response?.status).toBe(200);
    expect(nominationFiles.data!.items[0]).toMatchObject({
      auditionRequired: true,
      canScheduleAudition: false,
    });
  });

  test('should give each nomination file of a magistrat its published reporters', async ({
    agent,
    expect,
    member,
    valrose,
  }) => {
    await agent.sessions.affectReporters({
      body: {
        items: [{ nominationFileId: valrose.nominationFile.id, priorities: [], reporterIds: [member['@user']!.id] }],
      },
      path: { sessionId: valrose.session.id },
      throwOnError: true,
    });
    const unpublished = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.magistratId },
    });
    expect(unpublished.data!.items[0]!.reporters).toEqual([]);

    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId: valrose.session.id },
      throwOnError: true,
    });
    const published = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.magistratId },
    });
    expect(published.data!.items[0]!.reporters).toEqual([expect.objectContaining({ id: member['@user']!.id })]);
  });

  test('should list the attachments of the observations of a session', async ({ agent, expect, valrose }) => {
    const file = makeFile({ name: `courrier_${crypto.randomUUID()}.pdf`, type: 'application/pdf' });
    const created = await agent.observations.createObservation({
      body: {
        files: [file],
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation avec une pièce jointe',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const attachments = await agent.observations.listObservationsAttachments({
      path: { sessionId: valrose.session.id },
      query: { magistratId: valrose.magistratId },
    });

    expect(attachments.response?.status).toBe(200);
    expect(attachments.data!.items).toEqual([
      expect.objectContaining({ name: file.name, observationId: created.data!.id }),
    ]);
  });

  test('should refuse an observation on a nomination file of another session', async ({
    agent,
    expect,
    sessions,
    valrose,
  }) => {
    const otherSession = await sessions.createOne({ ...VALROSE_SESSION, createdAt: '22/05/2026' });

    const refused = await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation déposée sur la mauvaise session',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: otherSession.id },
    });

    expect(refused.response?.status).toBe(404);
  });

  test('should follow up on an observation and show it in the list of the nomination files', async ({
    agent,
    expect,
    valrose,
  }) => {
    const created = await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation à suivre',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const followedUp = await agent.observations.followUpOnObservation({
      body: { comment: null, followUp: 'ALERT' },
      path: {
        nominationFileId: valrose.nominationFile.id,
        observationId: created.data!.id,
        sessionId: valrose.session.id,
      },
    });
    expect(followedUp.response?.status).toBe(204);

    const files = await agent.sessions.listNominationFiles({ path: { sessionId: valrose.session.id } });
    const file = files.data!.items.find(({ id }) => id === valrose.nominationFile.id);
    expect(file!.observations).toEqual([expect.objectContaining({ followUp: 'ALERT', id: created.data!.id })]);
  });

  test('should list the observations received by a magistrat', async ({ agent, expect, valrose }) => {
    const withoutObservation = await agent.magistrats.listMagistratObservations({
      path: { magistratId: valrose.magistratId },
    });
    expect(withoutObservation.response?.status).toBe(200);
    expect(withoutObservation.data).toMatchObject({ items: [], totalCount: 0 });

    await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation déposée pour le test E2E',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const observations = await agent.magistrats.listMagistratObservations({
      path: { magistratId: valrose.magistratId },
    });
    expect(observations.response?.status).toBe(200);
    expect(observations.data).toMatchObject({ totalCount: 1 });
    expect(observations.data!.items[0]).toMatchObject({
      dateReception: { day: 2, month: 5, year: 2026 },
      nominationFile: {
        auditionRequired: true,
        id: valrose.nominationFile.id,
        name: expect.stringMatching(/valrose/i),
        session: { id: valrose.session.id, status: 'ONGOING' },
      },
    });
  });

  test('should list the observations of a nomination file with the nomination files', async ({
    agent,
    expect,
    valrose,
  }) => {
    await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation listée avec les dossiers',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const files = await agent.sessions.listNominationFiles({ path: { sessionId: valrose.session.id } });
    const file = files.data!.items.find(({ id }) => id === valrose.nominationFile.id);

    expect(file!.observations).toEqual([
      expect.objectContaining({
        date: { day: 2, month: 5, year: 2026 },
        followUp: null,
        followUpComment: null,
        hasDescription: true,
        hasUserComment: false,
        magistrat: expect.objectContaining({ id: valrose.magistratId }),
      }),
    ]);
  });

  test('should name the observants in the export of the nomination files', async ({ agent, expect, valrose }) => {
    await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: "Observation reprise dans l'export",
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: valrose.nominationFile.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const exported = await agent.sessions.listNominationFilesAsExcel({
      parseAs: 'arrayBuffer',
      path: { sessionId: valrose.session.id },
      throwOnError: true,
    });

    const [header, ...rows] = parse(Buffer.from(exported.data as ArrayBuffer))[0]!.data as string[][];
    const observants = header!.indexOf('Observants');
    const row = rows.find((cells) => cells.some((cell) => /valrose/i.test(String(cell))));
    expect(row![observants]).toBe('HONORINE VALROSE');
  });

  test('should list the observations of the most recent session first, without the deleted ones', async ({
    agent,
    expect,
    sessions,
    valrose,
  }) => {
    const laterSession = await sessions.createOne({ ...VALROSE_SESSION, createdAt: '22/05/2026' });
    const laterFiles = await agent.sessions.listNominationFiles({
      path: { sessionId: laterSession.id },
      throwOnError: true,
    });
    for (const [sessionId, nominationFileId] of [
      [valrose.session.id, valrose.nominationFile.id],
      [laterSession.id, laterFiles.data!.items[0]!.id],
    ] as const) {
      await agent.observations.createObservation({
        body: {
          form: observationForm({
            dateReception: '2026-05-02',
            description: 'Observation sur deux sessions',
            magistratId: valrose.magistratId,
          }),
        },
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });
    }

    const listed = await agent.magistrats.listMagistratObservations({ path: { magistratId: valrose.magistratId } });
    expect(listed.data!.items.map(({ nominationFile }) => nominationFile.session.id)).toEqual([
      laterSession.id,
      valrose.session.id,
    ]);

    await agent.sessions.deleteNominationSession({ path: { sessionId: laterSession.id }, throwOnError: true });

    const remaining = await agent.magistrats.listMagistratObservations({
      path: { magistratId: valrose.magistratId },
    });
    expect(remaining.data).toMatchObject({ totalCount: 1 });
    expect(remaining.data!.items.map(({ nominationFile }) => nominationFile.session.id)).toEqual([valrose.session.id]);
  });

  test('should order the observations of a session by nomination file number', async ({ agent, expect, valrose }) => {
    const [lowerFile, higherFile] = [valrose.nominationFile, valrose.otherNominationFile].sort(
      (a, b) => a.content.numeroDeDossier! - b.content.numeroDeDossier!,
    );

    await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation la plus ancienne, sur le plus petit numéro de dossier',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: lowerFile!.id, sessionId: valrose.session.id },
      throwOnError: true,
    });
    await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-06-01',
          description: 'Observation la plus récente, sur le plus grand numéro de dossier',
          magistratId: valrose.magistratId,
        }),
      },
      path: { nominationFileId: higherFile!.id, sessionId: valrose.session.id },
      throwOnError: true,
    });

    const observations = await agent.magistrats.listMagistratObservations({
      path: { magistratId: valrose.magistratId },
    });
    expect(observations.response?.status).toBe(200);
    expect(observations.data!.items.map((item) => item.nominationFile.id)).toEqual([lowerFile!.id, higherFile!.id]);
  });

  test('should share the audition of an observant between their observations only', async ({
    agent,
    expect,
    valrose,
  }) => {
    const [scheduled, other] = await Promise.all(
      [valrose.nominationFile, valrose.otherNominationFile].map((file) =>
        agent.observations
          .createObservation({
            body: { form: observationForm({ dateReception: '2026-05-02', magistratId: valrose.magistratId }) },
            path: { nominationFileId: file.id, sessionId: valrose.session.id },
            throwOnError: true,
          })
          .then(({ data }) => ({ nominationFileId: file.id, observationId: data!.id, sessionId: valrose.session.id })),
      ),
    );

    const response = await agent.observations.scheduleObservantAudition({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 12, minutes: 30 } },
      path: scheduled!,
    });
    expect(response.response?.status).toBe(204);

    const details = await agent.observations.getObservationDetails({ path: other!, throwOnError: true });
    expect(details.data!.observant.audition).toMatchObject({
      date: { day: 12, month: 12, year: 2028 },
      time: { hours: 12, minutes: 30 },
    });

    const nominationFiles = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: valrose.magistratId },
      throwOnError: true,
    });
    expect(nominationFiles.data!.items[0]).toMatchObject({ auditionDate: null, auditionTime: null });
  });

  test('should unschedule the audition of an observant', async ({ agent, expect, valrose }) => {
    const path = await agent.observations
      .createObservation({
        body: { form: observationForm({ dateReception: '2026-05-02', magistratId: valrose.magistratId }) },
        path: { nominationFileId: valrose.otherNominationFile.id, sessionId: valrose.session.id },
        throwOnError: true,
      })
      .then(({ data }) => ({
        nominationFileId: valrose.otherNominationFile.id,
        observationId: data!.id,
        sessionId: valrose.session.id,
      }));
    await agent.observations.scheduleObservantAudition({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 12, minutes: 30 } },
      path,
      throwOnError: true,
    });

    const response = await agent.observations.scheduleObservantAudition({
      body: { auditionDate: null, auditionTime: null },
      path,
    });
    expect(response.response?.status).toBe(204);

    const details = await agent.observations.getObservationDetails({ path, throwOnError: true });
    expect(details.data!.observant.audition).toBeNull();
  });

  test('should drop the audition of an observant with their last observation of the session', async ({
    agent,
    expect,
    valrose,
  }) => {
    const createObservation = (nominationFileId: string) =>
      agent.observations
        .createObservation({
          body: { form: observationForm({ dateReception: '2026-05-02', magistratId: valrose.magistratId }) },
          path: { nominationFileId, sessionId: valrose.session.id },
          throwOnError: true,
        })
        .then(({ data }) => ({ nominationFileId, observationId: data!.id, sessionId: valrose.session.id }));
    const first = await createObservation(valrose.nominationFile.id);
    const second = await createObservation(valrose.otherNominationFile.id);
    await agent.observations.scheduleObservantAudition({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 12, minutes: 30 } },
      path: first,
      throwOnError: true,
    });

    await agent.observations.deleteObservation({ path: first, throwOnError: true });
    const kept = await agent.observations.getObservationDetails({ path: second, throwOnError: true });
    expect(kept.data!.observant.audition).not.toBeNull();

    await agent.observations.deleteObservation({ path: second, throwOnError: true });
    const recreated = await createObservation(valrose.otherNominationFile.id);
    const details = await agent.observations.getObservationDetails({ path: recreated, throwOnError: true });
    expect(details.data!.observant.audition).toBeNull();
  });
});
