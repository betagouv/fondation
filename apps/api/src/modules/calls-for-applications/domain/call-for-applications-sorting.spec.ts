import { DateOnly } from '../../../utils/date-only';

import { sortedCalls } from './call-for-applications-sorting';

function callOf(props: {
  createdOn?: DateOnly;
  deadline?: DateOnly | null;
  id: string;
  status?: 'PUBLISHED';
}) {
  return {
    createdOn: props.createdOn ?? new DateOnly(2026, 11, 1),
    deadline: props.deadline ?? null,
    id: props.id,
    publishedOn: null,
    status: props.status ?? 'UNPUBLISHED',
  } as const;
}

describe('sortedCalls', () => {
  it('keeps a call without deadline last, whatever the direction', () => {
    const calls = [
      callOf({ id: 'none' }),
      callOf({ deadline: new DateOnly(2027, 1, 15), id: 'january' }),
      callOf({ deadline: new DateOnly(2027, 3, 1), id: 'march' }),
    ];

    expect(sortedCalls(calls, { sortBy: 'deadline', sortDesc: false }).map(({ id }) => id)).toEqual([
      'january',
      'march',
      'none',
    ]);
    expect(sortedCalls(calls, { sortBy: 'deadline', sortDesc: true }).map(({ id }) => id)).toEqual([
      'march',
      'january',
      'none',
    ]);
  });

  it('lists the unpublished calls before the published ones', () => {
    const calls = [callOf({ id: 'published', status: 'PUBLISHED' }), callOf({ id: 'unpublished' })];

    expect(sortedCalls(calls, { sortBy: 'status', sortDesc: false }).map(({ id }) => id)).toEqual([
      'unpublished',
      'published',
    ]);
  });

  it('breaks a tie by the latest created', () => {
    const calls = [
      callOf({ createdOn: new DateOnly(2026, 11, 2), id: 'older' }),
      callOf({ createdOn: new DateOnly(2026, 11, 20), id: 'newer' }),
    ];

    expect(sortedCalls(calls, { sortBy: 'status', sortDesc: false }).map(({ id }) => id)).toEqual([
      'newer',
      'older',
    ]);
  });
});
