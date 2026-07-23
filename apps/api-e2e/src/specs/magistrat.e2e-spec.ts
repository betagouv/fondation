import { randomUUID } from 'node:crypto';

import type { LolfiData } from 'lolfi';

import { test } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
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

test.describe('Magistrat E2E', () => {
  test('should detail a magistrat with the same content for the secretariat general and the members', async ({
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
      lastName: expect.stringMatching(/^valrose$/i),
      observations: [],
    });

    const [agentProposition] = agentDetails.data!.propositions;
    expect(agentProposition).toMatchObject({
      auditionDate: { year: 2026, month: 9, day: 15 },
      auditionTime: { hours: 14, minutes: 30 },
      isArchived: false,
      isSessionOngoing: true,
      nominationFileId: nominationFile!.id,
      sessionId: session.id,
      targetedGrade: 'G3',
    });

    const memberDetails = await api.magistrats.detailMagistrat({
      client: member['@client'],
      path: { magistratId: magistratId! },
    });
    expect(memberDetails.response?.status).toBe(200);
    expect(memberDetails.data!.propositions[0]).toMatchObject({
      auditionDate: { year: 2026, month: 9, day: 15 },
      auditionTime: { hours: 14, minutes: 30 },
      nominationFileId: nominationFile!.id,
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

    const unknownMagistrat = await agent.magistrats.detailMagistrat({
      path: { magistratId: randomUUID() },
    });
    expect(unknownMagistrat.response?.status).toBe(404);

    const anonymous = await api.magistrats.detailMagistrat({
      client: makeHttpClient(baseUrl),
      path: { magistratId: magistratId! },
    });
    expect(anonymous.response?.status).toBe(401);
  });
});
