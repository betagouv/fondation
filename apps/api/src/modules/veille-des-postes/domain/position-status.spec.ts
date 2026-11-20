import { DateOnly } from '../../../utils/date-only';

import { positionStatusOf } from './position-status';

const today = new DateOnly(2026, 11, 16);

describe('positionStatusOf', () => {
  it.each([
    [
      new DateOnly(2026, 11, 16),
      { detail: 'Retraite depuis le 16/11/2026', hint: null, id: 'VACANT', label: 'Vacant' },
    ],
    [
      new DateOnly(2027, 3, 1),
      {
        detail: 'Retraite à compter du 01/03/2027',
        hint: null,
        id: 'MAY_BECOME_VACANT',
        label: 'Susceptible de devenir vacant',
      },
    ],
  ])('dates a vacancy declared from %s, even without alert', (startDate, status) => {
    expect(
      positionStatusOf(
        { alertCount: 0, held: true, vacancy: { reason: 'RETIREMENT', reasonDetail: null, startDate } },
        today,
      ),
    ).toEqual(status);
  });

  it.each([
    [{ alertCount: 0, held: false, vacancy: null }, 'VACANT'],
    [{ alertCount: 0, held: true, vacancy: null }, 'OCCUPIED'],
    [{ alertCount: 1, held: true, vacancy: null }, 'MAY_BECOME_VACANT'],
  ] as const)('gives the position %j the status %s', (position, status) => {
    expect(positionStatusOf(position, today).id).toBe(status);
  });

  it('keeps a declared vacancy over the alerts', () => {
    const vacancy = { reason: 'DEATH', reasonDetail: null, startDate: new DateOnly(2026, 1, 5) } as const;

    expect(positionStatusOf({ alertCount: 2, held: true, vacancy }, today).id).toBe('VACANT');
  });

  it('shows the detail of another reason on hover', () => {
    const vacancy = {
      reason: 'OTHER',
      reasonDetail: 'Détachement au ministère',
      startDate: new DateOnly(2026, 1, 5),
    } as const;

    expect(positionStatusOf({ alertCount: 0, held: true, vacancy }, today)).toMatchObject({
      detail: 'Autre motif depuis le 05/01/2026',
      hint: 'Détachement au ministère',
    });
  });
});
