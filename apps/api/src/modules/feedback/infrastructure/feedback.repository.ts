import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { assertNever } from '../../../utils/assert-never';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Feedback, FeedbackAnswered } from '../domain/feedback';

@Injectable()
export class FeedbackRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async persist(feedback: Feedback): Promise<void> {
    for (const message of feedback.messages) {
      if (message instanceof FeedbackAnswered) await this.persistFeedbackAnswered(message);
      else assertNever(message);
    }
  }

  private persistFeedbackAnswered(message: FeedbackAnswered) {
    const { member, secretariat, ...common } = message.answers;

    return this.db.tx.feedback.create({
      data: {
        ...common,
        answeredAt: this.clock.now(),
        member: member ? { create: member } : undefined,
        secretariat: secretariat ? { create: secretariat } : undefined,
        userId: message.userId,
      },
    });
  }
}
