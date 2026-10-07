import { Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Feedback, QUESTIONNAIRES, type Respondent } from '../../domain/feedback';
import { Prisma } from 'src/generated/prisma/client';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

const FEEDBACK_STATUSES = ['ANSWERED', 'NOT_ANSWERED', 'PREVIEW', 'TEST'] as const;

@Injectable()
export class FindFeedbackQuery {
  constructor(
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
    private readonly db: Db,
  ) {}

  async handle(query: { respondent: Respondent }): Promise<FoundFeedbackDto> {
    const access = Feedback.accessOf(query.respondent, { isTest: this.config.isTestEnvironment });
    if (!access) return { feedback: null };
    if (access.mode === 'PREVIEW')
      return {
        feedback: {
          last: null,
          questionnaire: access.questionnaire,
          status: 'PREVIEW',
        },
      };

    const last = await this.db.tx.feedback.findFirst({
      orderBy: { answeredAt: 'desc' },
      select: { answeredAt: true } satisfies Prisma.FeedbackSelect,
      where: { userId: query.respondent.id },
    });

    return {
      feedback: {
        last: last ? { answeredOn: DateOnly.fromInstantInParis(last.answeredAt).toJson() } : null,
        questionnaire: access.questionnaire,
        status: access.mode === 'TEST' ? 'TEST' : last ? 'ANSWERED' : 'NOT_ANSWERED',
      },
    };
  }
}

export class FoundFeedbackDto extends createZodDto(
  z.object({
    feedback: z
      .object({
        last: z.object({ answeredOn: dateOnlyJsonSchema }).nullable(),
        questionnaire: z.enum(QUESTIONNAIRES),
        status: z.enum(FEEDBACK_STATUSES),
      })
      .nullable(),
  }),
) {}
