import { DateOnly } from 'src/utils/date-only';

import {
  ObservantAudition,
  ObservantAuditionScheduled,
  ObservantAuditionUnscheduled,
} from './observant-audition';

const auditionDateTime = { date: new DateOnly(2028, 12, 12), time: { hours: 12, minutes: 30, seconds: 0 } };
const AUTHOR = { impersonatorId: null, userId: 'user-1' };
const OPEN_FILE = { allowsAudition: true, isLocked: false };
const CLOSED_FILE = { allowsAudition: false, isLocked: false };
const LOCKED_FILE = { allowsAudition: true, isLocked: true };

function audition(observedNominationFiles: readonly { allowsAudition: boolean; isLocked: boolean }[]) {
  return ObservantAudition.from({
    magistratId: 'magistrat-1',
    observedNominationFiles,
    sessionId: 'session-1',
  });
}

describe('ObservantAudition', () => {
  it('schedules the audition while one observed nomination file is still being processed', () => {
    const observantAudition = audition([CLOSED_FILE, OPEN_FILE]);

    observantAudition.schedule({ auditionDateTime, ...AUTHOR });

    expect(observantAudition.messages).toEqual([
      new ObservantAuditionScheduled('session-1', 'magistrat-1', auditionDateTime, 'user-1', null),
    ]);
  });

  it.each([
    { files: [CLOSED_FILE], reason: 'FINAL_OUTCOME' },
    { files: [LOCKED_FILE], reason: 'LOCKED' },
    { files: [CLOSED_FILE, LOCKED_FILE], reason: 'NOT_IN_PROGRESS' },
  ])('refuses the audition with the reason $reason', ({ files, reason }) => {
    const observantAudition = audition(files);

    expect(() => observantAudition.schedule({ auditionDateTime, ...AUTHOR })).toThrow(
      expect.objectContaining({ magistratId: 'magistrat-1', reason }),
    );
  });

  it('unschedules the audition whatever the observed nomination files', () => {
    const observantAudition = audition([CLOSED_FILE]);

    observantAudition.unschedule(AUTHOR);

    expect(observantAudition.messages).toEqual([
      new ObservantAuditionUnscheduled('session-1', 'magistrat-1', 'user-1', null),
    ]);
  });
});
