import * as crypto from 'node:crypto';

import { test } from '../fixtures.ts';
import type { DeclarePositionVacancyDto } from '../generated/api/types.ts';
import type { TestStepsAdmin } from '../steps.ts';
import { makeFile } from '../utils/files.ts';
import * as seed from '../utils/seed.ts';

/** fixed far from any alert, so that the scenarios keep their alerts whatever the day they run */
const TWO_YEARS_AGO = { months: 0, years: -2 };
const YOUNG_BIRTH_DATE = '01/01/1980';

test.describe('Veille des postes E2E', () => {
  test('should declare a vacancy with its attachment, then come back to the computed status', async ({
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
    const listed = async () => {
      const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
        query: { search: lastName },
        throwOnError: true,
      });
      return data.items[0]!;
    };
    const magistratId = (await listed()).magistrat!.id;

    await agent.veilleDesPostes.declarePositionVacancy({
      body: {
        files: [makeFile({ name: 'decision.pdf', type: 'application/pdf' })],
        form: vacancyForm({ reason: 'OTHER', reasonDetail: 'Détachement', startDate: '2026-01-05' }),
      },
      path: { magistratId },
      throwOnError: true,
    });

    expect((await listed()).status).toEqual({
      detail: 'Autre motif depuis le 05/01/2026',
      hint: 'Détachement',
      id: 'VACANT',
      label: 'Vacant',
    });
    const { data: found } = await agent.veilleDesPostes.findPositionVacancy({
      path: { magistratId },
      throwOnError: true,
    });
    expect(found.status).toEqual({
      detail: 'Autre motif depuis le 05/01/2026',
      hint: 'Détachement',
      id: 'VACANT',
      label: 'Vacant',
    });
    expect(found.vacancy).toEqual({
      attachments: [expect.objectContaining({ name: 'decision.pdf' })],
      reason: { id: 'OTHER', label: 'Autre' },
      reasonDetail: 'Détachement',
      startDate: { day: 5, month: 1, year: 2026 },
      updatedAt: expect.any(String),
      updatedBy: expect.objectContaining({ id: expect.any(String) }),
    });

    await agent.veilleDesPostes.withdrawPositionVacancy({ path: { magistratId }, throwOnError: true });

    expect((await listed()).status).toEqual({
      detail: null,
      hint: null,
      id: 'MAY_BECOME_VACANT',
      label: 'Susceptible de devenir vacant',
    });
  });

  test('should filter a vacancy declared in eight months within the next twelve months', async ({
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
    const { files } = await sessions.createOne({
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
      // a session beyond twelve months gives the proposal no deadline: only the vacancy answers the filter
      createdAt: lolfiDateIn({ months: 0, years: 2 }),
      name: `Transparence ${lastName}`,
    });
    const { day, month, year } = dateOnlyIn({ months: 8, years: 0 });
    await agent.veilleDesPostes.declarePositionVacancy({
      body: {
        form: vacancyForm({
          reason: 'RETIREMENT',
          startDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        }),
      },
      path: { magistratId: files[0]!.magistratId },
      throwOnError: true,
    });
    const listedWithin = async (deadline: 'WITHIN_SIX_MONTHS' | 'WITHIN_TWELVE_MONTHS') => {
      const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
        query: { deadlines: [deadline], search: lastName },
        throwOnError: true,
      });
      return data.items.map(({ magistrat }) => magistrat?.id);
    };

    expect(await listedWithin('WITHIN_TWELVE_MONTHS')).toEqual([files[0]!.magistratId]);
    expect(await listedWithin('WITHIN_SIX_MONTHS')).toEqual([]);
  });

  test('should delete a vacancy once a LOLFI import moved its magistrat', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const holder = {
      birthDate: YOUNG_BIRTH_DATE,
      firstName: 'ZOE',
      id: crypto.randomInt(1e6, 1e7),
      installationDate: lolfiDateIn(TWO_YEARS_AGO),
      lastName,
    };
    const grasse = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  GRASSE'] };
    const lyon = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  LYON'] };
    const { files } = await sessions.createOne({
      candidates: [{ ...holder, position: grasse, targetPosition: grasse }],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName} à Grasse`,
    });
    const { magistratId } = files[0]!;
    await agent.veilleDesPostes.declarePositionVacancy({
      body: {
        files: [makeFile({ name: 'acte.pdf', type: 'application/pdf' })],
        form: vacancyForm({ reason: 'DEATH', startDate: '2026-01-05' }),
      },
      path: { magistratId },
      throwOnError: true,
    });

    const { files: moved } = await sessions.createOne({
      candidates: [{ ...holder, position: lyon, targetPosition: lyon }],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName} à Lyon`,
    });

    expect(moved[0]!.magistratId).toBe(magistratId);
    const { data: found } = await agent.veilleDesPostes.findPositionVacancy({
      path: { magistratId },
      throwOnError: true,
    });
    expect(found.vacancy).toBeNull();
  });

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
        commentPreview: null,
        court: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: { id: expect.any(String), name: `${lastName} Zoe`, title: expect.any(String) },
        status: { detail: null, hint: null, id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
    ]);
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
        commentPreview: null,
        court: { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse' },
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: { id: expect.any(String), name: `${lastName} Zoe`, title: expect.any(String) },
        // the archive of the test labels a court of appeal only met as a ressort with its code
        ressort: { id: 'CA  AIX EN PROVENCE', label: expect.any(String) },
        status: { detail: null, hint: null, id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
    ]);

    const { data: otherRessort } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { ressorts: ['CA  LYON'], search: lastName },
      throwOnError: true,
    });

    expect(otherRessort.items).toEqual([]);
  });

  test('should give the president of a court the comment of their court', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  TOULON'],
    };
    const { files } = await sessions.createOne({
      candidates: [
        { birthDate: YOUNG_BIRTH_DATE, firstName: 'ZOE', lastName, position: president, targetPosition: president },
      ],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName}`,
    });
    await agent.veilleDesPostes.writeCourtComment({
      body: { comment: `Intérim ${lastName}` },
      path: { courtId: 'TJ  TOULON' },
      throwOnError: true,
    });

    const { data } = await agent.veilleDesPostes.findPositionComment({
      path: { magistratId: files[0]!.magistratId },
      throwOnError: true,
    });

    expect(data.comment).toBe(`Intérim ${lastName}`);
  });

  test('should keep the comment of a court when LOLFI moves its president', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const narbonne = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  NARBONNE'],
    };
    const beziers = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  BEZIERS'],
    };
    const holder = { birthDate: YOUNG_BIRTH_DATE, firstName: 'ZOE', lastName };
    await sessions.createOne({
      candidates: [{ ...holder, position: narbonne, targetPosition: narbonne }],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName} à Narbonne`,
    });
    await agent.veilleDesPostes.writeCourtComment({
      body: { comment: `Successeur pressenti ${lastName}` },
      path: { courtId: 'TJ  NARBONNE' },
      throwOnError: true,
    });

    await sessions.createOne({
      candidates: [{ ...holder, position: beziers, targetPosition: beziers }],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName} à Béziers`,
    });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { search: 'Narbonne' },
      throwOnError: true,
    });
    // no other test names a president of Narbonne: the court is left without one
    expect(data.items).toEqual([
      expect.objectContaining({
        commentPreview: `Successeur pressenti ${lastName}`,
        court: expect.objectContaining({ id: 'TJ  NARBONNE' }),
        magistrat: null,
      }),
    ]);
  });

  test('should leave out the favorable proposal of a holder LOLFI already put on the position it targets', async ({
    admin,
    agent,
    docs,
    expect,
    member,
    registerUser,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const grasse = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  GRASSE'] };
    const session = await sessions.createOne(
      {
        candidates: [
          {
            birthDate: YOUNG_BIRTH_DATE,
            firstName: 'ZOE',
            installationDate: lolfiDateIn(TWO_YEARS_AGO),
            lastName,
            position: grasse,
            targetPosition: grasse,
          },
        ],
        createdAt: '22/04/2026',
        name: `Transparence ${lastName}`,
      },
      { outcome: { comment: null, value: 'VALIDATED' }, reporters: [member['@user']!] },
    );
    await agent.sessions.validateSession({ path: { sessionId: session.id }, throwOnError: true });
    const chairmanId = await siegeChairman({ admin, registerUser });
    await docs.officialReport(await docs.agenda(session, { chairmanId }), { chairmanId, status: 'VALIDATED' });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { search: lastName },
      throwOnError: true,
    });

    expect(data.items).toEqual([expect.objectContaining({ alerts: [] })]);
  });

  test('should leave out the proposal of a holder once a validated official report gives it an unfavorable outcome', async ({
    admin,
    agent,
    docs,
    expect,
    member,
    registerUser,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const grasse = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  GRASSE'] };
    const lyon = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  LYON'] };
    const holder = { birthDate: YOUNG_BIRTH_DATE, installationDate: lolfiDateIn(TWO_YEARS_AGO), lastName };
    const session = await sessions.createOne(
      {
        candidates: [
          { ...holder, firstName: 'ZOE', position: grasse, targetPosition: grasse },
          { ...holder, firstName: 'BRUNO', position: lyon, targetPosition: lyon },
        ],
        createdAt: '22/04/2026',
        name: `Transparence ${lastName}`,
      },
      { outcome: { comment: 'Profil inadapté', value: 'NON_VALIDATED' }, reporters: [member['@user']!] },
    );
    await agent.sessions.validateSession({ path: { sessionId: session.id }, throwOnError: true });
    const chairmanId = await siegeChairman({ admin, registerUser });
    const agenda = await docs.agenda(session, { chairmanId, files: [session.files[0]!] });
    await docs.officialReport(agenda, { chairmanId, status: 'VALIDATED' });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { search: lastName },
      throwOnError: true,
    });

    // the other file keeps the session from being reported as a whole
    expect(data.items).toEqual([
      expect.objectContaining({ alerts: [], court: expect.objectContaining({ id: 'TJ  GRASSE' }) }),
      expect.objectContaining({
        alerts: [expect.objectContaining({ id: 'PROPOSED_IN_SESSION' })],
        court: expect.objectContaining({ id: 'TJ  LYON' }),
      }),
    ]);
  });

  test('should list the president of a tribunal de première instance under the ressort of its TSA by city', async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TPI SAINT PIERRE ET MIQUELON'],
    };
    const toulouse = { ...president, jurisdiction: seed.jurisdictions['TJ  TOULOUSE'] };
    await sessions.createOne({
      candidates: [
        {
          birthDate: YOUNG_BIRTH_DATE,
          civilite: 'MME',
          firstName: 'ZOE',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
          lastName,
          position: president,
          targetPosition: president,
        },
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'BRUNO',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
          lastName,
          position: toulouse,
          targetPosition: toulouse,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { search: lastName },
      throwOnError: true,
    });

    // by code "CA  TOULOUSE" would come before "TSA SAINT PIERRE ET MIQUELON"
    expect(
      data.ressorts.map(({ id }) => id).filter((id) => id === 'CA  TOULOUSE' || id === 'TSA SAINT PIERRE ET MIQUELON'),
    ).toEqual(['TSA SAINT PIERRE ET MIQUELON', 'CA  TOULOUSE']);
    expect(data.items).toEqual([
      expect.objectContaining({
        court: {
          id: 'TPI SAINT PIERRE ET MIQUELON',
          label: 'Tribunal de première instance de Saint-Pierre et Miquelon',
        },
        magistrat: {
          id: expect.any(String),
          name: `${lastName} Zoe`,
          title: 'Présidente du tribunal de première instance de Saint-Pierre et Miquelon',
        },
        ressort: { id: 'TSA SAINT PIERRE ET MIQUELON', label: expect.any(String) },
      }),
      expect.objectContaining({ court: { id: 'TJ  TOULOUSE', label: 'Tribunal judiciaire de Toulouse' } }),
    ]);
  });

  test("should list the president of a tribunal supérieur d'appel with the first presidents by city", async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TSA SAINT PIERRE ET MIQUELON'],
    };
    const toulouse = {
      function: seed.functions.PP,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CA  TOULOUSE'],
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
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'BRUNO',
          installationDate: lolfiDateIn(TWO_YEARS_AGO),
          lastName,
          position: toulouse,
          targetPosition: toulouse,
        },
      ],
      createdAt: '22/04/2026',
      name: 'Transparence annuelle',
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { search: lastName },
      throwOnError: true,
    });

    // by code "CA  TOULOUSE" would come before "TSA SAINT PIERRE ET MIQUELON"
    expect(data.items).toEqual([
      expect.objectContaining({
        court: {
          id: 'TSA SAINT PIERRE ET MIQUELON',
          label: "Tribunal supérieur d'appel de Saint-Pierre et Miquelon",
        },
        magistrat: {
          id: expect.any(String),
          name: `${lastName} Zoe`,
          title: "Président du tribunal supérieur d'appel de Saint-Pierre et Miquelon",
        },
      }),
      expect.objectContaining({ court: { id: 'CA  TOULOUSE', label: "Cour d'appel de Toulouse" } }),
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
      commentPreview: null,
      court: { id: 'CA  AMIENS', label: "Cour d'appel d'Amiens" },
      installationDate: null,
      magistrat: null,
      status: { detail: null, hint: null, id: 'VACANT', label: 'Vacant' },
    });
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
        magistrat: {
          commentPreview: null,
          id: expect.any(String),
          name: `${lastName}D Camille`,
          title: expect.any(String),
        },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { detail: null, hint: null, id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
      {
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        installationDate: null,
        magistrat: {
          commentPreview: null,
          id: expect.any(String),
          name: `${lastName}A Aline`,
          title: expect.any(String),
        },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { detail: null, hint: null, id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
      {
        alerts: [
          expect.objectContaining({ id: 'PROPOSED_IN_SESSION', shortLabel: 'Proposé en session du 22/04/2026' }),
        ],
        installationDate: dateOnlyIn(TWO_YEARS_AGO),
        magistrat: {
          commentPreview: null,
          id: expect.any(String),
          name: `${lastName}B Zoe`,
          title: expect.any(String),
        },
        service: { id: 'ORDINARY', label: 'Service ordinaire' },
        status: { detail: null, hint: null, id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
      },
    ]);
  });

  test('should name the holder of a proposal a validated official report gives a favorable outcome', async ({
    admin,
    agent,
    docs,
    expect,
    member,
    registerUser,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const grasse = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  GRASSE'] };
    const lyon = { function: seed.functions.P, grade: 'G3' as const, jurisdiction: seed.jurisdictions['TJ  LYON'] };
    const session = await sessions.createOne(
      {
        candidates: [
          {
            birthDate: YOUNG_BIRTH_DATE,
            civilite: 'MME',
            firstName: 'ZOE',
            installationDate: lolfiDateIn(TWO_YEARS_AGO),
            lastName,
            position: grasse,
            targetPosition: lyon,
          },
        ],
        createdAt: '22/04/2026',
        name: `Transparence ${lastName}`,
      },
      { outcome: { comment: null, value: 'VALIDATED' }, reporters: [member['@user']!] },
    );
    await agent.sessions.validateSession({ path: { sessionId: session.id }, throwOnError: true });
    const chairmanId = await siegeChairman({ admin, registerUser });
    await docs.officialReport(await docs.agenda(session, { chairmanId }), { chairmanId, status: 'VALIDATED' });

    const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
      query: { search: lastName },
      throwOnError: true,
    });

    // LOLFI has not put her on the position of Lyon yet
    expect(data.items).toEqual([
      expect.objectContaining({
        alerts: [expect.objectContaining({ shortLabel: 'Nommée en session du 22/04/2026' })],
        court: expect.objectContaining({ id: 'TJ  GRASSE' }),
      }),
    ]);
  });

  test('should not find the vacancy nor the comment of a magistrat whose position no table lists', async ({
    agent,
    expect,
    sessions,
  }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const counsellor = {
      function: seed.functions.C,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  GRASSE'],
    };
    const { files } = await sessions.createOne({
      candidates: [
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ALINE',
          lastName,
          position: counsellor,
          targetPosition: counsellor,
        },
      ],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName}`,
    });

    const path = { magistratId: files[0]!.magistratId };

    const vacancy = await agent.veilleDesPostes.findPositionVacancy({ path });
    const comment = await agent.veilleDesPostes.findPositionComment({ path });

    expect(vacancy.response?.status).toBe(404);
    expect(comment.response?.status).toBe(404);
  });

  test('should open, rename and remove an attachment of a declared vacancy', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const president = {
      function: seed.functions.P,
      grade: 'G3' as const,
      jurisdiction: seed.jurisdictions['TJ  GRASSE'],
    };
    const { files } = await sessions.createOne({
      candidates: [
        { birthDate: YOUNG_BIRTH_DATE, firstName: 'ZOE', lastName, position: president, targetPosition: president },
      ],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName}`,
    });
    const { magistratId } = files[0]!;
    await agent.veilleDesPostes.declarePositionVacancy({
      body: {
        files: [makeFile({ name: 'arrete.pdf', type: 'application/pdf' })],
        form: vacancyForm({ reason: 'RETIREMENT', startDate: '2027-03-01' }),
      },
      path: { magistratId },
      throwOnError: true,
    });
    const attachments = async () => {
      const { data } = await agent.veilleDesPostes.findPositionVacancy({ path: { magistratId }, throwOnError: true });
      return data.vacancy!.attachments;
    };
    const fileId = (await attachments())[0]!.id;

    const { data: opened } = await agent.veilleDesPostes.openPositionVacancyAttachment({
      path: { fileId, magistratId },
      throwOnError: true,
    });
    expect(opened).toEqual({ id: fileId, name: 'arrete.pdf', url: expect.any(String) });

    await agent.veilleDesPostes.renamePositionVacancyAttachment({
      body: { name: 'Arrêté de mise à la retraite' },
      path: { fileId, magistratId },
      throwOnError: true,
    });
    expect((await attachments()).map(({ name }) => name)).toEqual(['Arrêté de mise à la retraite.pdf']);

    await agent.veilleDesPostes.removePositionVacancyAttachment({ path: { fileId, magistratId }, throwOnError: true });
    expect(await attachments()).toEqual([]);
  });

  test('should show the comment of a court of appeal in its table', async ({ agent, expect, sessions }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');
    const firstPresident = {
      function: seed.functions.PP,
      grade: 'G3sup' as const,
      jurisdiction: seed.jurisdictions['CA  MONTPELLIER'],
    };
    await sessions.createOne({
      candidates: [
        {
          birthDate: YOUNG_BIRTH_DATE,
          firstName: 'ZOE',
          lastName,
          position: firstPresident,
          targetPosition: firstPresident,
        },
      ],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName}`,
    });

    await agent.veilleDesPostes.writeCourtComment({
      body: { comment: `Souhaite partir en 2027 ${lastName}` },
      path: { courtId: 'CA  MONTPELLIER' },
      throwOnError: true,
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { search: `Montpellier ${lastName}` },
      throwOnError: true,
    });
    expect(data.items[0]!.commentPreview).toBe(`Souhaite partir en 2027 ${lastName}`);
  });

  test('should show the comment of a holder of the Cour de cassation in its table', async ({
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
    const { files } = await sessions.createOne({
      candidates: [
        { birthDate: YOUNG_BIRTH_DATE, firstName: 'ZOE', lastName, position: counsellor, targetPosition: counsellor },
      ],
      createdAt: '22/04/2026',
      name: `Transparence ${lastName}`,
    });

    await agent.veilleDesPostes.writePositionComment({
      body: { comment: 'Souhaite partir en 2027' },
      path: { magistratId: files[0]!.magistratId },
      throwOnError: true,
    });

    const { data } = await agent.veilleDesPostes.listCourtOfCassationHolders({
      query: { search: lastName },
      throwOnError: true,
    });
    expect(data.items[0]!.magistrat.commentPreview).toBe('Souhaite partir en 2027');
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

  test('should write a comment on a court, show it in the table, then erase it', async ({ agent, expect }) => {
    const path = { courtId: 'TJ  NARBONNE' };
    const listed = async () => {
      const { data } = await agent.veilleDesPostes.listJudicialCourtPresidents({
        query: { search: 'Narbonne' },
        throwOnError: true,
      });
      return data.items[0]!;
    };
    const write = (comment: string) =>
      agent.veilleDesPostes.writeCourtComment({ body: { comment }, path, throwOnError: true });

    await write('  Souhaite partir en 2027 ');

    const { data: found } = await agent.veilleDesPostes.findCourtComment({ path, throwOnError: true });
    expect(found).toMatchObject({
      comment: 'Souhaite partir en 2027',
      lastChange: { at: expect.any(String), by: expect.objectContaining({ id: expect.any(String) }) },
    });
    expect((await listed()).commentPreview).toBe('Souhaite partir en 2027');

    await write('   ');

    const { data: erased } = await agent.veilleDesPostes.findCourtComment({ path, throwOnError: true });
    expect(erased).toMatchObject({ comment: null, lastChange: null });
    expect((await listed()).commentPreview).toBeNull();
  });

  test('should write a comment on a vacant court of appeal', async ({ agent, expect }) => {
    const lastName = Array.from({ length: 12 }, () => String.fromCharCode(65 + crypto.randomInt(26))).join('');

    await agent.veilleDesPostes.writeCourtComment({
      body: { comment: `Poste à pourvoir ${lastName}` },
      path: { courtId: 'CA  REIMS' },
      throwOnError: true,
    });

    const { data } = await agent.veilleDesPostes.listCourtOfAppealFirstPresidents({
      query: { search: 'Reims' },
      throwOnError: true,
    });
    // no test names a first president of Reims
    expect(data.items).toEqual([
      expect.objectContaining({ commentPreview: `Poste à pourvoir ${lastName}`, magistrat: null }),
    ]);
  });
});

/** the presidents of the judicial courts are named by the formation of the siège */
async function siegeChairman(fixtures: {
  admin: TestStepsAdmin;
  registerUser: (role: 'MEMBRE_DU_SIEGE') => Promise<{ id: string }>;
}): Promise<string> {
  const chairman = await fixtures.registerUser('MEMBRE_DU_SIEGE');
  await fixtures.admin.administration.updateRole({
    body: { role: 'PRESIDENT_SIEGE' },
    path: { userId: chairman.id },
    throwOnError: true,
  });
  return chairman.id;
}

/** the form travels as a JSON part of the multipart body: the generated client types it as the object it holds */
function vacancyForm(form: DeclarePositionVacancyDto['form']): DeclarePositionVacancyDto['form'] {
  return new Blob([JSON.stringify(form)], { type: 'application/json' }) as unknown as DeclarePositionVacancyDto['form'];
}

function lolfiDateIn(offset: { months: number; years: number }): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + offset.years, date.getMonth() + offset.months);
  return date.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}

function dateOnlyIn(offset: { months: number; years: number }): { day: number; month: number; year: number } {
  const [day, month, year] = lolfiDateIn(offset).split('/').map(Number);
  return { day: day!, month: month!, year: year! };
}
