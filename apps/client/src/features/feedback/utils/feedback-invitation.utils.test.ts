import { describe, expect, it } from 'vitest';

import { isInvitationDue } from './feedback-invitation.utils';

const OCTOBER_10 = { day: 10, month: 10, year: 2026 };

describe('isInvitationDue', () => {
  it.each([
    { case: 'never invited', expected: true, lastInvitedOn: null },
    { case: 'invited the day before', expected: false, lastInvitedOn: { day: 9, month: 10, year: 2026 } },
    { case: 'invited 2 days before', expected: true, lastInvitedOn: { day: 8, month: 10, year: 2026 } },
  ])('asks someone who never answered during the campaign when $case', ({ expected, lastInvitedOn }) => {
    expect(isInvitationDue({ lastAnsweredOn: null, lastInvitedOn, today: OCTOBER_10 })).toBe(expected);
  });

  it('asks nothing more during the campaign once answered', () => {
    expect(
      isInvitationDue({
        lastAnsweredOn: { day: 1, month: 10, year: 2026 },
        lastInvitedOn: null,
        today: { day: 31, month: 10, year: 2026 },
      }),
    ).toBe(false);
  });

  it.each([
    {
      case: 'answered less than a month ago',
      expected: false,
      lastAnsweredOn: { day: 15, month: 10, year: 2026 },
      lastInvitedOn: null,
    },
    {
      case: 'answered a month ago',
      expected: true,
      lastAnsweredOn: { day: 2, month: 10, year: 2026 },
      lastInvitedOn: null,
    },
    {
      case: 'answered a month ago but put off less than a week ago',
      expected: false,
      lastAnsweredOn: { day: 2, month: 10, year: 2026 },
      lastInvitedOn: { day: 28, month: 10, year: 2026 },
    },
    {
      case: 'never answered and put off a week ago',
      expected: true,
      lastAnsweredOn: null,
      lastInvitedOn: { day: 25, month: 10, year: 2026 },
    },
  ])('asks after the campaign when $case', ({ expected, lastAnsweredOn, lastInvitedOn }) => {
    expect(isInvitationDue({ lastAnsweredOn, lastInvitedOn, today: { day: 1, month: 11, year: 2026 } })).toBe(
      expected,
    );
  });
});
