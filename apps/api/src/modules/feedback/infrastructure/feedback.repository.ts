import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Feedback, FeedbackAnswered } from '../domain/feedback';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';

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
