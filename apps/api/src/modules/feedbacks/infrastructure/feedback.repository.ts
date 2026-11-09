import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Feedback, FeedbackSent, FeedbackStatusChanged } from '../domain/feedback';

@Injectable()
export class FeedbackRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async find(predicate: { feedbackId: string }): Promise<Feedback> {
    const feedback = await this.db.tx.feedback.findUnique({
      select: { id: true, status: true, statusComment: true } satisfies Prisma.FeedbackSelect,
      where: { id: predicate.feedbackId },
    });
    if (!feedback) throw new NotFoundException();

    return Feedback.from({
      id: feedback.id,
      status: { comment: feedback.statusComment, value: feedback.status },
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(feedback: Feedback): Promise<void> {
    for (const message of feedback.messages) {
      if (message instanceof FeedbackSent) await this.persistFeedbackSent(message);
      else if (message instanceof FeedbackStatusChanged) await this.persistFeedbackStatusChanged(message);
      else assertNever(message);
    }
  }

  private persistFeedbackSent(message: FeedbackSent) {
    return this.db.tx.feedback.create({
      data: {
        authorId: message.authorId,
        id: message.feedbackId,
        impersonatedId: message.impersonatedId,
        sentAt: this.clock.now(),
        text: message.text,
        url: message.url,
      },
    });
  }

  private persistFeedbackStatusChanged(message: FeedbackStatusChanged) {
    const { comment, value } = message.status;
    const changedAt = this.clock.now();
    return this.db.tx.feedback.update({
      data: {
        status: value,
        statusChangedAt: changedAt,
        statusChangedById: message.changedBy,
        statusChanges: {
          create: { changedAt, changedBy: message.changedBy, comment, status: value },
        },
        statusComment: comment,
      },
      where: { id: message.feedbackId },
    });
  }
}
