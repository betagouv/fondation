import type { LolfiArchiveContent } from 'lolfi';

import { test as base } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

const VALROSE_SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'HONORINE',
      lastName: 'VALROSE',
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
      civilite: expect.any(String),
      currentPosition: {
        function: { label: expect.any(String) },
        id: expect.any(Number),
        jurisdiction: { id: expect.any(String) },
      },
      externalUrl: expect.any(String),
      firstName: expect.stringMatching(/^honorine$/i),
      id: valrose.magistratId,
      lastName: expect.stringMatching(/^valrose$/i),
    });
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
