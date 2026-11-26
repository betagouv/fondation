import { DateOnly } from '../../../utils/date-only';

import { alertsOf, type HolderFacts } from './position-alert';
import { positionStatusOf } from './position-status';
import { alertFacetValues, sortedByUrgency } from './position-urgency';

const TODAY = new DateOnly(2026, 11, 13);
const PRESIDENT = { movesAfterSevenYears: true, retirementAge: 67 };
const NO_FILTER = { alert: [], deadline: [] };

function position(
  name: string,
  facts: Partial<HolderFacts> | null,
  vacancyStartDate: DateOnly | null = null,
) {
  const alerts = facts
    ? alertsOf(
        { birthDate: null, civility: null, installationDate: null, proposal: null, ...facts },
        PRESIDENT,
        TODAY,
      )
    : [];
  return {
    alerts,
    name,
    status: positionStatusOf(
      {
        alertCount: alerts.length,
        held: !!facts,
        vacancy: vacancyStartDate
          ? { reason: 'RETIREMENT', reasonDetail: null, startDate: vacancyStartDate }
          : null,
      },
      TODAY,
    ),
    vacancyStartDate,
  };
}

const LATER_RETIREMENT = position('retirement in ten months, proposal next month', {
  birthDate: new DateOnly(1960, 9, 13),
  proposal: {
    sessionDate: new DateOnly(2026, 12, 10),
    sessionName: 'Décembre',
    stage: 'PROPOSED',
    targetedPosition: null,
  },
});
const SOON_RETIREMENT = position('retirement in three months', { birthDate: new DateOnly(1960, 2, 13) });
const DECLARED = position('vacancy declared in two months', {}, new DateOnly(2027, 1, 13));
const OCCUPIED = position('occupied without alert', {});
const VACANT = position('vacant', null);

describe('alertFacetValues', () => {
  it('ties the deadline asked to the alert asked', () => {
    const values = alertFacetValues({ alert: ['RETIREMENT'], deadline: ['WITHIN_SIX_MONTHS'] }, TODAY);

    expect(values.alert(LATER_RETIREMENT.alerts)).toEqual(['PROPOSED_IN_SESSION']);
    expect(values.deadline(LATER_RETIREMENT)).toEqual(['WITHIN_TWELVE_MONTHS']);
  });

  it('answers the deadline of a declared vacancy', () => {
    const values = alertFacetValues(NO_FILTER, TODAY);

    expect(values.deadline(position('vacancy in eight months', {}, new DateOnly(2027, 7, 21)))).toEqual([
      'WITHIN_TWELVE_MONTHS',
    ]);
    expect(values.deadline(position('vacancy started', {}, new DateOnly(2026, 11, 1)))).toEqual([
      'WITHIN_SIX_MONTHS',
      'WITHIN_TWELVE_MONTHS',
    ]);
    expect(values.deadline(position('vacancy in two years', {}, new DateOnly(2028, 11, 13)))).toEqual([]);
  });

  it('answers both deadlines for a court without holder', () => {
    expect(alertFacetValues(NO_FILTER, TODAY).deadline(VACANT)).toEqual([
      'WITHIN_SIX_MONTHS',
      'WITHIN_TWELVE_MONTHS',
    ]);
  });

  it('leaves out a vacancy when an alert is asked', () => {
    const values = alertFacetValues({ alert: ['RETIREMENT'], deadline: [] }, TODAY);

    expect(values.deadline(DECLARED)).toEqual([]);
    expect(values.deadline(VACANT)).toEqual([]);
  });
});

describe('sortedByUrgency', () => {
  const positions = [OCCUPIED, LATER_RETIREMENT, VACANT, SOON_RETIREMENT];

  it('keeps the occupied positions last in the other direction', () => {
    expect(sortedByUrgency(positions, NO_FILTER, true).map(({ name }) => name)).toEqual([
      'retirement in three months',
      'retirement in ten months, proposal next month',
      'vacant',
      'occupied without alert',
    ]);
  });

  it('puts the vacancies first, then the earliest alerts, and the occupied positions last', () => {
    expect(sortedByUrgency(positions, NO_FILTER, false).map(({ name }) => name)).toEqual([
      'vacant',
      'retirement in ten months, proposal next month',
      'retirement in three months',
      'occupied without alert',
    ]);
  });

  it('sorts a vacancy declared ahead by its start date', () => {
    expect(
      sortedByUrgency([OCCUPIED, SOON_RETIREMENT, DECLARED, LATER_RETIREMENT], NO_FILTER, false).map(
        ({ name }) => name,
      ),
    ).toEqual([
      'retirement in ten months, proposal next month',
      'vacancy declared in two months',
      'retirement in three months',
      'occupied without alert',
    ]);
  });

  it('sorts on the alerts asked, not on a nearer one', () => {
    expect(
      sortedByUrgency(
        [LATER_RETIREMENT, SOON_RETIREMENT],
        { alert: ['RETIREMENT'], deadline: [] },
        false,
      ).map(({ name }) => name),
    ).toEqual(['retirement in three months', 'retirement in ten months, proposal next month']);
  });
});
