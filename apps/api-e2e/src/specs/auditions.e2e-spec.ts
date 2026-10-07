import type { LolfiArchiveContent } from 'lolfi';

import { test as base } from '../fixtures.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

const SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'HONORINE',
      lastName: 'VALROSE',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'] },
    },
    {
      firstName: 'GERTRUDE',
      lastName: 'MONTFERRAND',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  AMIENS'] },
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
  return new Blob([JSON.stringify(form)], { type: 'application/json' }) as unknown as CreateObservationDto['form'];
}

const test = base.extend('session', async ({ agent, sessions }) => {
  const session = await sessions.createOne(SESSION);
  const files = await agent.sessions
    .listNominationFiles({ path: { sessionId: session.id }, throwOnError: true })
    .then(({ data }) => data!.items);
  const valrose = files.find((file) => /valrose/i.test(file.content.nomMagistrat))!;
  const montferrand = files.find((file) => /montferrand/i.test(file.content.nomMagistrat))!;

  return { id: session.id, montferrand, valrose };
});

test.describe('Auditions E2E', () => {
  test('should list the propositions whose audition is to schedule', async ({ agent, expect, session }) => {
    const auditions = await agent.sessions.listSessionAuditions({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    expect(auditions.data!.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          audition: null,
          propositions: [expect.objectContaining({ nominationFileId: session.montferrand.id })],
          role: 'PROPOSED',
        }),
      ]),
    );
  });

  test('should list a proposed magistrat and an observant heard in the session', async ({ agent, expect, session }) => {
    await agent.sessions.updateNominationFileAuditionDate({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 9, minutes: 30 } },
      path: { nominationFileId: session.montferrand.id, sessionId: session.id },
      throwOnError: true,
    });
    const observationId = await agent.observations
      .createObservation({
        body: {
          form: observationForm({
            dateReception: '2026-05-02',
            magistratId: session.valrose.content.detectedMagistratId!,
          }),
        },
        path: { nominationFileId: session.montferrand.id, sessionId: session.id },
        throwOnError: true,
      })
      .then(({ data }) => data!.id);
    await agent.observations.scheduleObservantAudition({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 10, minutes: 30 } },
      path: { nominationFileId: session.montferrand.id, observationId, sessionId: session.id },
      throwOnError: true,
    });

    const auditions = await agent.sessions.listSessionAuditions({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    expect(auditions.data!.items.filter(({ audition }) => audition)).toMatchObject([
      {
        audition: { time: { hours: 9, minutes: 30 } },
        propositions: [{ nominationFileId: session.montferrand.id, observationId: null }],
        role: 'PROPOSED',
      },
      {
        audition: { time: { hours: 10, minutes: 30 } },
        magistrat: { id: session.valrose.content.detectedMagistratId },
        propositions: [{ nominationFileId: session.montferrand.id, observationId }],
        role: 'OBSERVANT',
      },
    ]);
  });
});
