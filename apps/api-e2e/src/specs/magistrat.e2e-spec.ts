import { randomUUID } from 'node:crypto';

import type { LolfiData } from 'lolfi';

import { test } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type { CreateObservationDto } from '../generated/api/types.ts';
import { makeHttpClient } from '../steps.ts';
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
  ],
  createdAt: '22/04/2026',
  name: 'Transparence annuelle',
};

function observationForm(form: CreateObservationDto['form']): CreateObservationDto['form'] {
  return new Blob([JSON.stringify(form)], {
    type: 'application/json',
  }) as unknown as CreateObservationDto['form'];
}

test.describe('Magistrat E2E', () => {
  test('should detail a magistrat and list its nomination files and observations', async ({
    agent,
    baseUrl,
    expect,
    member,
    sessions,
  }) => {
    const session = await sessions.createOne(VALROSE_SESSION);

    const nominationFiles = await agent.sessions
      .listNominationFiles({ path: { sessionId: session.id }, throwOnError: true })
      .then(({ data }) => data!.items);
    const [nominationFile] = nominationFiles;
    expect(nominationFile).toBeDefined();

    const magistratId = nominationFile!.content.detectedMagistratId;
    expect(magistratId).toEqual(expect.any(String));

    await agent.sessions.updateNominationFileAuditionDate({
      body: {
        auditionDate: { year: 2026, month: 9, day: 15 },
        auditionTime: { hours: 14, minutes: 30 },
      },
      path: { nominationFileId: nominationFile!.id, sessionId: session.id },
      throwOnError: true,
    });

    const agentDetails = await agent.magistrats.detailMagistrat({
      path: { magistratId: magistratId! },
    });
    expect(agentDetails.response?.status).toBe(200);
    expect(agentDetails.data).toMatchObject({
      id: magistratId,
      externalUrl: expect.any(String),
      lastName: expect.stringMatching(/^valrose$/i),
    });

    const agentNominationFiles = await agent.magistrats.listMagistratNominationFiles({
      path: { magistratId: magistratId! },
    });
    expect(agentNominationFiles.response?.status).toBe(200);
    expect(agentNominationFiles.data).toMatchObject({ currentPageIndex: 1, totalCount: 1 });
    expect(agentNominationFiles.data!.items[0]).toMatchObject({
      auditionDate: { year: 2026, month: 9, day: 15 },
      auditionTime: { hours: 14, minutes: 30 },
      id: nominationFile!.id,
      outcome: null,
      session: { id: session.id, status: 'ONGOING' },
      targetedGrade: 'G3',
    });

    const memberNominationFiles = await api.magistrats.listMagistratNominationFiles({
      client: member['@client'],
      path: { magistratId: magistratId! },
    });
    expect(memberNominationFiles.response?.status).toBe(200);
    expect(memberNominationFiles.data!.items[0]).toMatchObject({ id: nominationFile!.id });

    const emptyObservations = await agent.magistrats.listMagistratObservations({
      path: { magistratId: magistratId! },
    });
    expect(emptyObservations.response?.status).toBe(200);
    expect(emptyObservations.data).toMatchObject({ items: [], totalCount: 0 });

    const createdObservation = await agent.observations.createObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          description: 'Observation déposée pour le test E2E',
          magistratId: magistratId!,
        }),
      },
      path: { nominationFileId: nominationFile!.id, sessionId: session.id },
    });
    expect(createdObservation.response?.status).toBe(201);

    const agentObservations = await agent.magistrats.listMagistratObservations({
      path: { magistratId: magistratId! },
    });
    expect(agentObservations.response?.status).toBe(200);
    expect(agentObservations.data).toMatchObject({ totalCount: 1 });
    expect(agentObservations.data!.items[0]).toMatchObject({
      dateReception: { year: 2026, month: 5, day: 2 },
      nominationFile: {
        id: nominationFile!.id,
        name: expect.stringMatching(/valrose/i),
        session: { id: session.id, status: 'ONGOING' },
      },
    });

    const memberSchedule = await api.sessions.updateNominationFileAuditionDate({
      body: {
        auditionDate: { year: 2026, month: 10, day: 1 },
        auditionTime: { hours: 10, minutes: 0 },
      },
      client: member['@client'],
      path: { nominationFileId: nominationFile!.id, sessionId: session.id },
    });
    expect(memberSchedule.response?.status).toBe(403);

    for (const listUnknown of [
      agent.magistrats.detailMagistrat({ path: { magistratId: randomUUID() } }),
      agent.magistrats.listMagistratNominationFiles({ path: { magistratId: randomUUID() } }),
      agent.magistrats.listMagistratObservations({ path: { magistratId: randomUUID() } }),
    ]) {
      const unknownMagistrat = await listUnknown;
      expect(unknownMagistrat.response?.status).toBe(404);
    }

    const anonymousClient = makeHttpClient(baseUrl);
    for (const anonymousCall of [
      api.magistrats.detailMagistrat({ client: anonymousClient, path: { magistratId: magistratId! } }),
      api.magistrats.listMagistratNominationFiles({
        client: anonymousClient,
        path: { magistratId: magistratId! },
      }),
      api.magistrats.listMagistratObservations({
        client: anonymousClient,
        path: { magistratId: magistratId! },
      }),
    ]) {
      const anonymous = await anonymousCall;
      expect(anonymous.response?.status).toBe(401);
    }
  });
});
