import { DateOnly } from '../../../utils/date-only';
import { alertsOf, type HolderFacts } from '../domain/position-alert';

import { facetedRows } from './faceted-rows';
import { statusAndAlertValues } from './holder-alerts';

const TODAY = new DateOnly(2026, 11, 13);
const PRESIDENT = { movesAfterSevenYears: true, retirementAge: 67 };

function holder(name: string, facts: Partial<HolderFacts>) {
  const alerts = alertsOf(
    { birthDate: null, installationDate: null, proposal: null, ...facts },
    PRESIDENT,
    TODAY,
  );
  return { alerts, name, status: { id: alerts.length > 0 ? 'MAY_BECOME_VACANT' : 'OCCUPIED' } };
}

const IN_TEN_MONTHS_RETIREMENT = holder('retirement in ten months, proposal next month', {
  birthDate: new DateOnly(1960, 9, 13),
  proposal: { sessionDate: new DateOnly(2026, 12, 10), sessionName: 'Décembre', targetedPosition: null },
});
const SOON_RETIREMENT = holder('retirement in three months', { birthDate: new DateOnly(1960, 2, 13) });
const WITHOUT_ALERT = holder('without alert', {});

describe('statusAndAlertValues', () => {
  it('ties the deadline asked to the alert asked', () => {
    const { counts, matching } = facetedRows(
      [IN_TEN_MONTHS_RETIREMENT, SOON_RETIREMENT, WITHOUT_ALERT],
      { alert: ['RETIREMENT'], deadline: ['WITHIN_SIX_MONTHS'], status: [] },
      statusAndAlertValues,
    );

    expect(matching.map(({ name }) => name)).toEqual(['retirement in three months']);
    expect(counts.alert.get('PROPOSED_IN_SESSION')).toBe(1);
    expect(counts.deadline.get('WITHIN_TWELVE_MONTHS')).toBe(2);
  });
});
