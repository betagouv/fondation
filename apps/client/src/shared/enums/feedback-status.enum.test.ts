import { describe, expect, it } from 'vitest';

import { FEEDBACK_STATUSES, FeedbackStatusEnumMessages } from './feedback-status.enum';

describe('FEEDBACK_STATUSES', () => {
  it('lists every status the API serves, each labelled', () => {
    expect(FEEDBACK_STATUSES.toSorted()).toEqual(Object.keys(FeedbackStatusEnumMessages).toSorted());
  });
});
