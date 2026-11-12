import * as crypto from 'node:crypto';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Veille des postes E2E', () => {
  test('should find a court of appeal by its ressort and its first president', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const firstPresident = {
      function: seed.functions.PP,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CA  LYON'],
    };
    await sessions.createOne({
      candidates: [
        {
          firstName: 'ZOE',
          installationDate: '01/09/2021',
          lastName,
          position: firstPresident,
          targetPosition: firstPresident,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { search: `Lyon ${lastName}` },
      throwOnError: true,
    });

    expect(data.items).toEqual([
      {
        court: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
        installationDate: { day: 1, month: 9, year: 2021 },
        magistrat: { id: expect.any(String), name: `${lastName} Zoe` },
        status: { id: 'OCCUPIED', label: 'Occupé' },
      },
    ]);
  });

  test('should list a court of appeal without first president as vacant', async ({ agent, expect, sessions }) => {
    const prosecutor = {
      function: seed.functions.PG,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CA  AMIENS'],
    };
    await sessions.createOne({
      candidates: [{ firstName: 'ALINE', lastName: 'MARTIN', position: prosecutor, targetPosition: prosecutor }],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { limit: 100, statuses: ['VACANT'] },
      throwOnError: true,
    });

    expect(data.items).toContainEqual({
      court: { id: 'CA  AMIENS', label: "Cour d'appel d'Amiens" },
      installationDate: null,
      magistrat: null,
      status: { id: 'VACANT', label: 'Vacant' },
    });
  });

  test('should find a judicial court by its ressort and its president, and count it in its ressort', async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  GRASSE'],
    };
    await sessions.createOne({
      candidates: [
        {
          firstName: 'ZOE',
          installationDate: '01/09/2021',
          lastName,
          position: president,
          targetPosition: president,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { ressorts: ['CA  AIX EN PROVENCE'], search: `Aix-en-Provence ${lastName}` },
      throwOnError: true,
    });

    expect(data.ressorts.filter(({ count }) => count > 0)).toEqual([
      { count: 1, id: 'CA  AIX EN PROVENCE', label: expect.any(String) },
    ]);

    expect(data.items).toEqual([
      {
        court: { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse' },
        installationDate: { day: 1, month: 9, year: 2021 },
        magistrat: { id: expect.any(String), name: `${lastName} Zoe` },
        // the archive of the test labels a court of appeal only met as a ressort with its code
        ressort: { id: 'CA  AIX EN PROVENCE', label: expect.any(String) },
        status: { id: 'OCCUPIED', label: 'Occupé' },
      },
    ]);
  });

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
    expect(data.positions.map(({ count, id }) => [id, count])).toEqual([
      ['FIRST_PRESIDENT', 0],
      ['CHAMBER_PRESIDENT', 1],
      ['COUNSELLOR', 1],
      ['REFERENDARY_COUNSELLOR', 0],
      ['AUDITOR_SECOND_GRADE', 0],
      ['AUDITOR_FIRST_GRADE', 0],
    ]);
  });
});
