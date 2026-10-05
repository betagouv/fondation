import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import {
  CannotGiveSessionFeedback,
  SessionFeedback,
  SessionFeedbackAnswered,
} from '../domain/session-feedback';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class SessionFeedbackRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async findBySession(predicate: { sessionId: string; userId: string }): Promise<SessionFeedback> {
    const session = await this.db.tx.session.findUnique({
      select: {
        feedbackParticipations: { select: { userId: true }, where: { userId: predicate.userId } },
        formation: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: predicate.sessionId },
    });
    if (!session) throw new NotFoundException();

    return SessionFeedback.from({
      formation: prismaFormationEnumToFormationEnum(session.formation),
      hasAnswered: session.feedbackParticipations.length > 0,
      sessionId: predicate.sessionId,
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(feedback: SessionFeedback): Promise<void> {
    for (const message of feedback.messages) {
      if (message instanceof SessionFeedbackAnswered) await this.persistSessionFeedbackAnswered(message);
      else assertNever(message);
    }
  }

  private async persistSessionFeedbackAnswered(message: SessionFeedbackAnswered) {
    const { member, secretariat, ...common } = message.answers;

    await this.createParticipation(message);
    await this.db.tx.sessionFeedback.create({
      data: {
        ...common,
        answeredOn: this.clock.now(),
        member: member ? { create: member } : undefined,
        secretariat: secretariat ? { create: secretariat } : undefined,
        sessionId: message.sessionId,
      },
    });
  }

  // two simultaneous submissions both pass the domain check: the primary key settles the race
  private async createParticipation(message: { sessionId: string; userId: string }) {
    try {
      await this.db.tx.sessionFeedbackParticipation.create({
        data: { sessionId: message.sessionId, userId: message.userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new CannotGiveSessionFeedback(message.sessionId, 'ALREADY_ANSWERED');
      throw error;
    }
  }
}
