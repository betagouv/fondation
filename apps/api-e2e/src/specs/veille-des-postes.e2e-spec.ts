import * as crypto from 'node:crypto';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

/** fixed far from any alert, so that the scenarios keep their alerts whatever the day they run */
const TWO_YEARS_AGO = { months: 0, years: -2 };
const YOUNG_BIRTH_DATE = '01/01/1980';

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
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ZOE',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
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
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        court: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: { id: expect.any(String), name: `${lastName} Zoe` },
        status: { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
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
      candidates: [
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ALINE',
          lastName: 'MARTIN',
          position: prosecutor,
          targetPosition: prosecutor,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { limit: 100, statuses: ['VACANT'] },
      throwOnError: true,
    });

    expect(data.items).toContainEqual({
      alerts: [],
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
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ZOE',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
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
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        court: { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse' },
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: { id: expect.any(String), name: `${lastName} Zoe` },
        // the archive of the test labels a court of appeal only met as a ressort with its code
        ressort: { id: 'CA  AIX EN PROVENCE', label: expect.any(String) },
        status: { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
    ]);

    const { data: otherRessort } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { ressorts: ['CA  LYON'], search: lastName },
      throwOnError: true,
    });

    expect(otherRessort.items).toEqual([]);
  });

  test('should warn of the retirement and of the seven years on the position of a president', async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  LYON'],
    };
    await sessions.createOne({
      candidates: [
        {
          birthDate: lolfiDateIn({ months: 4, years: -67 }),
          firstName: 'ZOE',
          installationDate: lolfiDateIn({ months: 3, years: -7 }),
          lastName: `${lastName}A`,
          position: president,
          targetPosition: president,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ALINE',
          lastName: `${lastName}B`,
          position: { ...president, jurisdiction: seed.jurisdictions['TJ  BEZIERS'] },
          targetPosition: president,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { alerts: ['RETIREMENT'], search: lastName },
      throwOnError: true,
    });

    expect(data.items.map(({ alerts, magistrat }) => [magistrat?.name, alerts.map(({ id }) => id)])).toEqual([
      [`${lastName}A Zoe`, ['PROPOSED_IN_SESSION', 'SEVEN_YEARS_ON_POSITION', 'RETIREMENT']],
    ]);
    expect(data.alerts.find(({ id }) => id === 'RETIREMENT')?.count).toBe(1);
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
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ZOE',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
          lastName: `${lastName}B`,
          position: counsellor,
          targetPosition: counsellor,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ALINE',
          lastName: `${lastName}A`,
          position: counsellor,
          targetPosition: counsellor,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'CAMILLE',
          lastName: `${lastName}D`,
          position: { ...counsellor, function: seed.functions.PC },
          targetPosition: counsellor,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
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
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        installationDate: null,
        magistrat: { id: expect.any(String), name: `${lastName}D Camille` },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
      {
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        installationDate: null,
        magistrat: { id: expect.any(String), name: `${lastName}A Aline` },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
      {
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: { id: expect.any(String), name: `${lastName}B Zoe` },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
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
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ALINE',
          lastName: `${lastName}A`,
          position: counsellor,
          targetPosition: counsellor,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
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

function lolfiDateIn(offset: { months: number; years: number }): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + offset.years, date.getMonth() + offset.months);
  return date.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}

function dateOnlyIn(offset: { months: number; years: number }): { day: number; month: number; year: number } {
  const [day, month, year] = lolfiDateIn(offset).split('/').map(Number);
  return { day: day!, month: month!, year: year! };
}
