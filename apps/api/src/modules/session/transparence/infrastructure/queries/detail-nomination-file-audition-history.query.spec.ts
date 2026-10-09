import { currentSchedule } from './detail-nomination-file-audition-history.query';

const RACHEL = { firstName: 'Rachel', id: 'user-1', lastName: 'Bernard' };
const ANTOINE = { firstName: 'Antoine', id: 'user-2', lastName: 'Roche' };
const DAY = new Date('2028-12-12T00:00:00Z');
const NINE = new Date('1970-01-01T09:00:00Z');
const TEN = new Date('1970-01-01T10:00:00Z');

function version(props: { author?: typeof RACHEL; date?: Date; minute: number; time?: Date }) {
  return {
    author: props.author ?? RACHEL,
    date: props.date ?? null,
    time: props.time ?? null,
    writtenAt: new Date(Date.UTC(2026, 9, 8, 9, props.minute)),
  };
}

describe('currentSchedule', () => {
  it('credits the date to whom set the current one', () => {
    const moved = version({ author: ANTOINE, date: DAY, minute: 1, time: TEN });

    expect(currentSchedule([version({ date: DAY, minute: 0, time: NINE }), moved])).toBe(moved);
  });

  it('forgets a date once removed', () => {
    expect(
      currentSchedule([version({ date: DAY, minute: 0, time: NINE }), version({ minute: 1 })]),
    ).toBeNull();
  });
});
