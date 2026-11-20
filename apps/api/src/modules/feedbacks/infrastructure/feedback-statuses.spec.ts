import { PrismaFeedbackStatusEnum } from '../../../generated/prisma/enums';
import { FEEDBACK_STATUSES } from '../domain/feedback';

describe('FEEDBACK_STATUSES', () => {
  it('lists every status of the database, in the order the list sorts on', () => {
    expect(FEEDBACK_STATUSES).toEqual(Object.values(PrismaFeedbackStatusEnum));
  });
});
