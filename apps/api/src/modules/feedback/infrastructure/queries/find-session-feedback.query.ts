import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { QUESTIONNAIRES, SessionFeedback, type Respondent } from '../../domain/session-feedback';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

const FEEDBACK_STATUSES = ['ANSWERED', 'NOT_ANSWERED', 'PREVIEW'] as const;

@Injectable()
export class FindSessionFeedbackQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { respondent: Respondent; sessionId: string }): Promise<FoundSessionFeedbackDto> {
    const session = await this.db.tx.session.findUnique({
      select: {
        date: true,
        feedbackParticipations: { select: { userId: true }, where: { userId: query.respondent.id } },
        formation: true,
        id: true,
        name: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
    });
    if (!session) throw new NotFoundException();

    const access = SessionFeedback.accessOf(
      query.respondent,
      prismaFormationEnumToFormationEnum(session.formation),
    );
    if (!access) return { feedback: null };

    const hasAnswered = session.feedbackParticipations.length > 0;
    return {
      feedback: {
        questionnaire: access.questionnaire,
        session: { date: DateOnly.fromUtcDate(session.date).toJson(), id: session.id, name: session.name },
        status: access.mode === 'PREVIEW' ? 'PREVIEW' : hasAnswered ? 'ANSWERED' : 'NOT_ANSWERED',
      },
    };
  }
}

export class FoundSessionFeedbackDto extends createZodDto(
  z.object({
    feedback: z
      .object({
        questionnaire: z.enum(QUESTIONNAIRES),
        session: z.object({ date: dateOnlyJsonSchema, id: z.uuid(), name: z.string() }),
        status: z.enum(FEEDBACK_STATUSES),
      })
      .nullable(),
  }),
) {}
