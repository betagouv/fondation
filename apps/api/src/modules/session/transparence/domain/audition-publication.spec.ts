import { PublishableAuditions } from './audition-publication';
import { SessionTransparence, SessionTransparenceAuditionsPublished } from './session-transparence';

const AT_NINE = { date: { day: 12, month: 12, year: 2028 }, time: { hours: 9, minutes: 30, seconds: 0 } };
const AT_TEN = { date: { day: 12, month: 12, year: 2028 }, time: { hours: 10, minutes: 0, seconds: 0 } };

function auditions(
  props: Partial<Pick<PublishableAuditions, 'nominationFiles' | 'observants'>> = {},
): PublishableAuditions {
  return PublishableAuditions.from({
    nominationFiles: props.nominationFiles ?? new Map([['file-1', { audition: AT_NINE, requested: true }]]),
    observants: props.observants ?? new Map([['magistrat-1', AT_TEN]]),
  });
}

function session() {
  return SessionTransparence.from({
    formation: 'SIEGE',
    id: 'session-id',
    nominationFiles: [],
    version: null,
  });
}

describe('PublishableAuditions.equals', () => {
  it('matches two identical states', () => {
    expect(auditions().equals(auditions())).toBe(true);
  });

  it('tells a moved audition apart', () => {
    const moved = auditions({
      nominationFiles: new Map([['file-1', { audition: AT_TEN, requested: true }]]),
    });

    expect(auditions().equals(moved)).toBe(false);
  });

  it('tells a dismissed audition apart', () => {
    const dismissed = auditions({
      nominationFiles: new Map([['file-1', { audition: null, requested: false }]]),
    });

    expect(auditions().equals(dismissed)).toBe(false);
  });

  it('tells an added observant apart', () => {
    const added = auditions({
      observants: new Map([
        ['magistrat-1', AT_TEN],
        ['magistrat-2', AT_NINE],
      ]),
    });

    expect(auditions().equals(added)).toBe(false);
  });
});

describe('SessionTransparence.publishAuditions', () => {
  it('publishes the auditions a first time', () => {
    const transparence = session();

    transparence.publishAuditions({
      auditions: auditions(),
      impersonatorId: null,
      lastPublished: null,
      userId: 'user-id',
    });

    expect(transparence.messages).toEqual([
      new SessionTransparenceAuditionsPublished('session-id', auditions(), 'user-id', null),
    ]);
  });

  it('publishes nothing when nothing changed since the last publication', () => {
    const transparence = session();

    transparence.publishAuditions({
      auditions: auditions(),
      impersonatorId: null,
      lastPublished: auditions(),
      userId: 'user-id',
    });

    expect(transparence.messages).toEqual([]);
  });
});
