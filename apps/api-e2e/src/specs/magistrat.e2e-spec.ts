import type { LolfiData } from 'lolfi';

import { test as base } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

const VALROSE_SESSION: LolfiData['sessions'][number] = {
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
        auditionDate: { year: 2026, month: 9, day: 15 },
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
      auditionDate: { year: 2026, month: 9, day: 15 },
      auditionExpected: false,
      auditionTime: { hours: 14, minutes: 30 },
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
    expect(nominationFiles.data!.items[0]).toMatchObject({ auditionExpected: true });
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
      dateReception: { year: 2026, month: 5, day: 2 },
      nominationFile: {
        auditionExpected: false,
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
});
