import * as crypto from 'node:crypto';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Veille des postes E2E', () => {
  test('should list the holders of the Cour de cassation by position, then by last name', async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const counsellor = {
      function: seed.functions.C,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CC  PARIS'],
    };
    await sessions.createOne({
      candidates: [
        {
          firstName: 'ZOE',
          installationDate: '01/09/2021',
          lastName: `${lastName}B`,
          position: counsellor,
          targetPosition: counsellor,
        },
        { firstName: 'ALINE', lastName: `${lastName}A`, position: counsellor, targetPosition: counsellor },
        {
          firstName: 'CAMILLE',
          lastName: `${lastName}D`,
          position: { ...counsellor, function: seed.functions.PC },
          targetPosition: counsellor,
        },
        {
          firstName: 'BRUNO',
          lastName: `${lastName}C`,
          position: { ...counsellor, function: seed.functions.P },
          targetPosition: counsellor,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfCassationHolders({
      query: { search: lastName },
      throwOnError: true,
    });

    expect(data.totalCount).toBe(3);
    expect(data.items).toEqual([
      {
        installationDate: null,
        magistrat: { id: expect.any(String), name: `${lastName}D Camille` },
        position: { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'OCCUPIED', label: 'Occupé' },
      },
      {
        installationDate: null,
        magistrat: { id: expect.any(String), name: `${lastName}A Aline` },
        position: { id: 'COUNSELLOR', label: 'Conseiller' },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'OCCUPIED', label: 'Occupé' },
      },
      {
        installationDate: { day: 1, month: 9, year: 2021 },
        magistrat: { id: expect.any(String), name: `${lastName}B Zoe` },
        position: { id: 'COUNSELLOR', label: 'Conseiller' },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'OCCUPIED', label: 'Occupé' },
      },
    ]);
  });

  test('should list only the holders of the positions asked', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const counsellor = {
      function: seed.functions.C,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CC  PARIS'],
    };
    await sessions.createOne({
      candidates: [
        { firstName: 'ALINE', lastName: `${lastName}A`, position: counsellor, targetPosition: counsellor },
        {
          firstName: 'CAMILLE',
          lastName: `${lastName}B`,
          position: { ...counsellor, function: seed.functions.PC },
          targetPosition: counsellor,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfCassationHolders({
      query: { positions: ['CHAMBER_PRESIDENT'], search: lastName },
      throwOnError: true,
    });

    expect(data.items.map(({ magistrat }) => magistrat.name)).toEqual([`${lastName}B Camille`]);
    expect(data.totalCount).toBe(1);
    expect(data.positions.map(({ holders, id }) => [id, holders])).toEqual([
      ['FIRST_PRESIDENT', 0],
      ['CHAMBER_PRESIDENT', 1],
      ['COUNSELLOR', 1],
      ['REFERENDARY_COUNSELLOR', 0],
      ['AUDITOR_FIRST_GRADE', 0],
      ['AUDITOR_SECOND_GRADE', 0],
    ]);
  });
});
