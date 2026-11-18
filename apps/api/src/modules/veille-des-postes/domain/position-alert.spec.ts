import { DateOnly } from '../../../utils/date-only';

import { alertRulesOf, alertsOf, deadlinesOf, proposalStageOf } from './position-alert';

const TODAY = new DateOnly(2026, 11, 13);
const PRESIDENT = { movesAfterSevenYears: true, retirementAge: 67 };
const NO_DATES = { birthDate: null, civility: null, installationDate: null, proposal: null };

describe('alertsOf', () => {
  it('warns of the retirement twelve months before the age limit, not a day earlier', () => {
    expect(alertsOf({ ...NO_DATES, birthDate: new DateOnly(1960, 11, 13) }, PRESIDENT, TODAY)).toEqual([
      {
        deadline: 'WITHIN_TWELVE_MONTHS',
        dueDate: new DateOnly(2027, 11, 13),
        id: 'RETIREMENT',
        label: 'Départ en retraite prévisionnel à 67 ans à partir du 13/11/2027',
        shortLabel: 'Retraite le 13/11/2027',
      },
    ]);
    expect(alertsOf({ ...NO_DATES, birthDate: new DateOnly(1960, 11, 14) }, PRESIDENT, TODAY)).toEqual([]);
  });

  it('keeps warning of a retirement age already passed', () => {
    const [alert] = alertsOf({ ...NO_DATES, birthDate: new DateOnly(1958, 1, 1) }, PRESIDENT, TODAY);

    expect(alert).toEqual({
      deadline: 'WITHIN_SIX_MONTHS',
      dueDate: new DateOnly(2025, 1, 1),
      id: 'RETIREMENT',
      label: 'Âge limite de départ en retraite de 67 ans atteint le 01/01/2025',
      shortLabel: 'Âge limite atteint le 01/01/2025',
    });
  });

  it('gives the first president of the Cour de cassation one more year', () => {
    const holder = { ...NO_DATES, birthDate: new DateOnly(1959, 11, 13) };

    expect(alertsOf(holder, { movesAfterSevenYears: false, retirementAge: 68 }, TODAY)).toHaveLength(1);
    expect(
      alertsOf(
        { ...holder, birthDate: new DateOnly(1959, 11, 14) },
        { movesAfterSevenYears: false, retirementAge: 68 },
        TODAY,
      ),
    ).toEqual([]);
  });

  it('tells the seven years on the position already reached', () => {
    const [alert] = alertsOf({ ...NO_DATES, installationDate: new DateOnly(2018, 3, 1) }, PRESIDENT, TODAY);

    expect(alert?.label).toBe('7 ans en poste atteints le 01/03/2025');
  });

  it('warns of the seven years on the position six months before, for the presidents only', () => {
    const holder = { ...NO_DATES, installationDate: new DateOnly(2020, 5, 13) };

    expect(alertsOf(holder, PRESIDENT, TODAY)).toEqual([
      {
        deadline: 'WITHIN_SIX_MONTHS',
        dueDate: new DateOnly(2027, 5, 13),
        id: 'SEVEN_YEARS_ON_POSITION',
        label: 'En poste depuis plus de 7 ans à partir du 13/05/2027',
        shortLabel: '7 ans en poste le 13/05/2027',
      },
    ]);
    expect(alertsOf({ ...holder, installationDate: new DateOnly(2020, 5, 14) }, PRESIDENT, TODAY)).toEqual(
      [],
    );
    expect(alertsOf(holder, { movesAfterSevenYears: false, retirementAge: 67 }, TODAY)).toEqual([]);
  });

  it('warns of a proposal in a session, the most urgent alert first', () => {
    const alerts = alertsOf(
      {
        birthDate: new DateOnly(1960, 2, 1),
        civility: null,
        installationDate: null,
        proposal: {
          sessionDate: new DateOnly(2026, 12, 10),
          sessionName: 'Transparence de décembre',
          stage: 'PROPOSED',
          targetedPosition: 'Premier président CA  LYON',
        },
      },
      PRESIDENT,
      TODAY,
    );

    expect(alerts.map(({ id, label }) => [id, label])).toEqual([
      [
        'PROPOSED_IN_SESSION',
        'Proposé sur le poste "Premier président CA  LYON" de la session "Transparence de décembre" du 10/12/2026',
      ],
      ['RETIREMENT', 'Départ en retraite prévisionnel à 67 ans à partir du 01/02/2027'],
    ]);
  });
});

describe('a proposal for a session beyond twelve months', () => {
  it('answers no deadline', () => {
    const [alert] = alertsOf(
      {
        ...NO_DATES,
        proposal: {
          sessionDate: new DateOnly(2028, 1, 1),
          sessionName: 'Session lointaine',
          stage: 'PROPOSED',
          targetedPosition: null,
        },
      },
      PRESIDENT,
      TODAY,
    );

    expect(alert?.deadline).toBeNull();
    expect(deadlinesOf([alert!])).toEqual([]);
  });
});

describe('deadlinesOf', () => {
  it('counts an alert within six months within twelve months too', () => {
    const [soon] = alertsOf({ ...NO_DATES, birthDate: new DateOnly(1960, 2, 1) }, PRESIDENT, TODAY);
    const [later] = alertsOf({ ...NO_DATES, birthDate: new DateOnly(1960, 9, 1) }, PRESIDENT, TODAY);

    expect(deadlinesOf([soon!])).toEqual(['WITHIN_SIX_MONTHS', 'WITHIN_TWELVE_MONTHS']);
    expect(deadlinesOf([later!])).toEqual(['WITHIN_TWELVE_MONTHS']);
    expect(deadlinesOf([])).toEqual([]);
  });
});

describe('alertRulesOf', () => {
  it.each([
    ['COURT_OF_APPEAL_FIRST_PRESIDENT', { movesAfterSevenYears: true, retirementAge: 67 }],
    ['JUDICIAL_COURT_PRESIDENT', { movesAfterSevenYears: true, retirementAge: 67 }],
    ['FIRST_PRESIDENT', { movesAfterSevenYears: false, retirementAge: 68 }],
    ['COUNSELLOR', { movesAfterSevenYears: false, retirementAge: 67 }],
  ] as const)('gives the %s position its rules', (position, rules) => {
    expect(alertRulesOf(position)).toEqual(rules);
  });
});

describe('proposalStageOf', () => {
  const NOT_REPORTED = { isArchived: false, isOnTargetedPosition: false, isReported: false, outcome: null };

  it('leaves a proposal proposed until a validated official report gives it a final outcome', () => {
    expect(proposalStageOf(NOT_REPORTED)).toBe('PROPOSED');
  });

  it('awaits nothing more of a proposal reported with an outcome other than favorable', () => {
    expect(proposalStageOf({ ...NOT_REPORTED, isReported: true, outcome: 'NON_VALIDATED' })).toBeNull();
  });

  it('names the holder of a proposal reported as favorable until they are on the position it targets', () => {
    const favorable = { ...NOT_REPORTED, isReported: true, outcome: 'VALIDATED' } as const;

    expect(proposalStageOf(favorable)).toBe('NOMINATED');
    expect(proposalStageOf({ ...favorable, isOnTargetedPosition: true })).toBeNull();
  });

  it('awaits nothing of an archived session', () => {
    expect(proposalStageOf({ ...NOT_REPORTED, isArchived: true })).toBeNull();
  });
});

describe('the alert of a favorable proposal', () => {
  it('names the holder in the session', () => {
    const [alert] = alertsOf(
      {
        ...NO_DATES,
        proposal: {
          sessionDate: new DateOnly(2026, 10, 16),
          sessionName: 'Transparence Automne 2026',
          stage: 'NOMINATED',
          targetedPosition: 'Premier président CA  LYON',
        },
      },
      PRESIDENT,
      TODAY,
    );

    expect(alert).toMatchObject({
      label:
        'Nommé sur le poste "Premier président CA  LYON" de la session "Transparence Automne 2026" du 16/10/2026',
      shortLabel: 'Nommé en session du 16/10/2026',
    });
  });
});

describe('the alert of a proposal for a woman', () => {
  it('agrees with her civility', () => {
    const proposal = {
      sessionDate: new DateOnly(2026, 10, 16),
      sessionName: 'Transparence Automne 2026',
      stage: 'PROPOSED',
      targetedPosition: null,
    } as const;

    const [proposed] = alertsOf({ ...NO_DATES, civility: 'MME', proposal }, PRESIDENT, TODAY);
    const [nominated] = alertsOf(
      { ...NO_DATES, civility: 'MME', proposal: { ...proposal, stage: 'NOMINATED' } },
      PRESIDENT,
      TODAY,
    );

    expect(proposed?.shortLabel).toBe('Proposée en session du 16/10/2026');
    expect(nominated?.label).toBe(
      'Nommée sur un poste de la session "Transparence Automne 2026" du 16/10/2026',
    );
  });
});
