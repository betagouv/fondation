import type { LolfiArchiveContent } from 'lolfi';
import { parse } from 'node-xlsx';

import { test as base } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

const SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'HONORINE',
      lastName: 'VALROSE',
      phone: '06.12.34.56.78',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'] },
    },
    {
      firstName: 'GERTRUDE',
      lastName: 'MONTFERRAND',
      phone: '01 02 03 04 05',
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

const SIEGE_SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'ALIX',
      lastName: 'FOURNERAY',
      position: { function: seed.functions.P, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
      targetPosition: {
        function: seed.functions.P,
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      },
    },
  ],
  createdAt: '22/04/2026',
  name: 'Transparence du siège',
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

  test('should list a proposition once the secretariat requests its audition', async ({ agent, expect, sessions }) => {
    const siege = await sessions.createOne(SIEGE_SESSION);
    const [file] = await agent.sessions
      .listNominationFiles({ path: { sessionId: siege.id }, throwOnError: true })
      .then(({ data }) => data!.items);

    await agent.sessions.updateNominationFileAuditionRequest({
      body: { requested: true },
      path: { nominationFileId: file!.id, sessionId: siege.id },
      throwOnError: true,
    });

    const auditions = await agent.sessions.listSessionAuditions({
      path: { sessionId: siege.id },
      throwOnError: true,
    });

    expect(auditions.data!.items).toMatchObject([{ audition: null, propositions: [{ nominationFileId: file!.id }] }]);
  });

  test('should no longer list a proposition whose scheduled audition the secretariat dismisses', async ({
    agent,
    expect,
    sessions,
  }) => {
    const siege = await sessions.createOne(SIEGE_SESSION);
    const [file] = await agent.sessions
      .listNominationFiles({ path: { sessionId: siege.id }, throwOnError: true })
      .then(({ data }) => data!.items);
    const path = { nominationFileId: file!.id, sessionId: siege.id };
    await agent.sessions.updateNominationFileAuditionRequest({ body: { requested: true }, path, throwOnError: true });
    await agent.sessions.updateNominationFileAuditionDate({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 9, minutes: 30 } },
      path,
      throwOnError: true,
    });

    await agent.sessions.updateNominationFileAuditionRequest({ body: { requested: false }, path, throwOnError: true });
    const auditions = await agent.sessions.listSessionAuditions({
      path: { sessionId: siege.id },
      throwOnError: true,
    });

    expect(auditions.data!.items).toEqual([]);
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
  test('should publish the auditions to the members', async ({ agent, expect, session }) => {
    await agent.sessions.publishSessionAuditions({ path: { sessionId: session.id }, throwOnError: true });

    const publication = await agent.sessions.detailLastSessionAuditionsPublication({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    expect(publication.data).toMatchObject({ lastPublished: { by: expect.any(Object) }, status: 'PUBLISHED' });
  });

  test('should tell the auditions changed since their publication', async ({ agent, expect, session }) => {
    await agent.sessions.publishSessionAuditions({ path: { sessionId: session.id }, throwOnError: true });
    await agent.sessions.updateNominationFileAuditionDate({
      body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 9, minutes: 30 } },
      path: { nominationFileId: session.montferrand.id, sessionId: session.id },
      throwOnError: true,
    });

    const publication = await agent.sessions.detailLastSessionAuditionsPublication({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    expect(publication.data!.status).toBe('UNPUBLISHED_CHANGES');
  });
  test('should show the members the published auditions without their contact', async ({
    agent,
    expect,
    member,
    session,
  }) => {
    await agent.sessions.publishSessionAuditions({ path: { sessionId: session.id }, throwOnError: true });

    const auditions = await api.sessions.listSessionAuditions({
      client: member['@client'],
      path: { sessionId: session.id },
      throwOnError: true,
    });

    expect(auditions.data!.items.map(({ contact }) => contact)).toEqual([null, null]);
    expect(auditions.data!.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          propositions: [expect.objectContaining({ nominationFileId: session.montferrand.id })],
        }),
      ]),
    );
  });

  test('should give the latest saved phone number of a magistrat, else the LOLFI one', async ({
    agent,
    expect,
    session,
  }) => {
    await agent.magistrats.addMagistratPhoneNumber({
      body: { label: 'Conjointe', number: '07 00 00 00 00' },
      path: { magistratId: session.valrose.content.detectedMagistratId! },
      throwOnError: true,
    });

    const auditions = await agent.sessions.listSessionAuditions({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    const phoneNumberOf = (magistratId: string | null) =>
      auditions.data!.items.find(({ magistrat }) => magistrat.id === magistratId)?.contact?.phoneNumber;
    expect(phoneNumberOf(session.valrose.content.detectedMagistratId)).toEqual({
      label: 'Conjointe',
      number: '0700000000',
    });
    expect(phoneNumberOf(session.montferrand.content.detectedMagistratId)).toEqual({
      label: null,
      number: '01 02 03 04 05',
    });

    const exported = await agent.sessions.listSessionAuditionsAsExcel({
      parseAs: 'arrayBuffer',
      path: { sessionId: session.id },
      throwOnError: true,
    });

    const [header, ...rows] = parse(Buffer.from(exported.data as ArrayBuffer))[0]!.data as string[][];
    const phone = header!.indexOf('Téléphone');
    expect(rows.map((row) => [row[0], row[phone], row[phone + 1] ?? ''])).toEqual([
      [expect.stringContaining('MONTFERRAND'), '01 02 03 04 05', ''],
      [expect.stringContaining('VALROSE'), '07 00 00 00 00', 'Conjointe'],
    ]);
  });
});
