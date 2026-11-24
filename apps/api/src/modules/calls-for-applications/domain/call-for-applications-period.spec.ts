import { DateOnly } from '../../../utils/date-only';

import { byPublication, periodOf, yearsOf } from './call-for-applications-period';

const TODAY = new DateOnly(2026, 11, 24);

function callOf(props: { createdOn?: DateOnly; id?: string; publishedOn?: DateOnly | null }) {
  return {
    createdOn: props.createdOn ?? new DateOnly(2026, 1, 5),
    deadline: null,
    id: props.id ?? 'call',
    publishedOn: props.publishedOn ?? null,
  };
}

describe('periodOf', () => {
  it('keeps a call ongoing on its deadline', () => {
    expect(periodOf({ deadline: TODAY }, TODAY)).toBe('ONGOING');
  });

  it('makes a call past the day after its deadline', () => {
    expect(periodOf({ deadline: new DateOnly(2026, 11, 23) }, TODAY)).toBe('PAST');
  });

  it('keeps a call without deadline ongoing', () => {
    expect(periodOf({ deadline: null }, TODAY)).toBe('ONGOING');
  });
});

describe('yearsOf', () => {
  it('spans the years from the publication to the deadline', () => {
    expect(
      yearsOf(
        {
          createdOn: new DateOnly(2026, 11, 2),
          deadline: new DateOnly(2027, 1, 15),
          publishedOn: new DateOnly(2026, 12, 1),
        },
        TODAY,
      ),
    ).toEqual([2026, 2027]);
  });

  it('starts at the creation while the call has no publication date', () => {
    expect(
      yearsOf(
        { createdOn: new DateOnly(2025, 12, 15), deadline: new DateOnly(2026, 1, 31), publishedOn: null },
        TODAY,
      ),
    ).toEqual([2025, 2026]);
  });

  it('runs until today while the call has no deadline, being still open', () => {
    expect(
      yearsOf({ createdOn: new DateOnly(2025, 12, 15), deadline: null, publishedOn: null }, TODAY),
    ).toEqual([2025, 2026]);
  });

  it('shows at once a call prepared for next year, from its creation to its publication', () => {
    expect(
      yearsOf(
        { createdOn: TODAY, deadline: new DateOnly(2027, 2, 1), publishedOn: new DateOnly(2027, 1, 4) },
        TODAY,
      ),
    ).toEqual([2026, 2027]);
  });
});

describe('byPublication', () => {
  it('lists the calls without publication date first, then the latest publication first', () => {
    const october = callOf({ id: 'october', publishedOn: new DateOnly(2026, 10, 1) });
    const december = callOf({ id: 'december', publishedOn: new DateOnly(2026, 12, 1) });
    const undated = callOf({ id: 'undated' });

    expect([october, undated, december].toSorted(byPublication).map(({ id }) => id)).toEqual([
      'undated',
      'december',
      'october',
    ]);
  });

  it('lists the latest created first among calls published the same day', () => {
    const publishedOn = new DateOnly(2026, 12, 1);
    const older = callOf({ createdOn: new DateOnly(2026, 11, 2), id: 'older', publishedOn });
    const newer = callOf({ createdOn: new DateOnly(2026, 11, 20), id: 'newer', publishedOn });

    expect([older, newer].toSorted(byPublication).map(({ id }) => id)).toEqual(['newer', 'older']);
  });
});
