import { currentAuditionChanges } from './detail-nomination-file-audition-history.query';

const RACHEL = { firstName: 'Rachel', id: 'user-1', lastName: 'Bernard' };
const ANTOINE = { firstName: 'Antoine', id: 'user-2', lastName: 'Roche' };
const DAY = new Date('2028-12-12T00:00:00Z');
const NINE = new Date('1970-01-01T09:00:00Z');
const TEN = new Date('1970-01-01T10:00:00Z');

function version(props: {
  author?: typeof RACHEL;
  date?: Date;
  minute: number;
  requested?: boolean;
  time?: Date;
}) {
  return {
    author: props.author ?? RACHEL,
    date: props.date ?? null,
    requested: props.requested ?? null,
    time: props.time ?? null,
    writtenAt: new Date(Date.UTC(2026, 9, 8, 9, props.minute)),
  };
}

describe('currentAuditionChanges', () => {
  it('credits the request to whom last turned it on', () => {
    const request = version({ author: ANTOINE, minute: 2, requested: true });

    const changes = currentAuditionChanges([
      version({ minute: 0, requested: true }),
      version({ minute: 1, requested: false }),
      request,
      version({ date: DAY, minute: 3, requested: true, time: NINE }),
    ]);

    expect(changes.requested).toBe(request);
  });

  it('credits the date to whom set the current one', () => {
    const moved = version({ author: ANTOINE, date: DAY, minute: 1, time: TEN });

    expect(currentAuditionChanges([version({ date: DAY, minute: 0, time: NINE }), moved]).scheduled).toBe(
      moved,
    );
  });

  it('forgets a date once removed', () => {
    expect(
      currentAuditionChanges([version({ date: DAY, minute: 0, time: NINE }), version({ minute: 1 })])
        .scheduled,
    ).toBeNull();
  });
});
