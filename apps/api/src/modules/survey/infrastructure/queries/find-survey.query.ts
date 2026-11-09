import { Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { API_CONFIG_TOKEN, ApiConfig } from '../../../framework/config';
import { Db } from '../../../framework/database';
import { Survey, QUESTIONNAIRES, type Respondent } from '../../domain/survey';

const SURVEY_STATUSES = ['ANSWERED', 'NOT_ANSWERED', 'PREVIEW', 'TEST'] as const;

@Injectable()
export class FindSurveyQuery {
  constructor(
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
    private readonly db: Db,
  ) {}

  async handle(query: { respondent: Respondent }): Promise<FoundSurveyDto> {
    const access = Survey.accessOf(query.respondent, { isTest: this.config.isTestEnvironment });
    if (!access) return { survey: null };
    if (access.mode === 'PREVIEW')
      return {
        survey: {
          last: null,
          questionnaire: access.questionnaire,
          status: 'PREVIEW',
        },
      };

    const last = await this.db.tx.survey.findFirst({
      orderBy: { answeredAt: 'desc' },
      select: { answeredAt: true } satisfies Prisma.SurveySelect,
      where: { userId: query.respondent.id },
    });

    return {
      survey: {
        last: last ? { answeredOn: DateOnly.fromInstantInParis(last.answeredAt).toJson() } : null,
        questionnaire: access.questionnaire,
        status: access.mode === 'TEST' ? 'TEST' : last ? 'ANSWERED' : 'NOT_ANSWERED',
      },
    };
  }
}

export class FoundSurveyDto extends createZodDto(
  z.object({
    survey: z
      .object({
        last: z.object({ answeredOn: dateOnlyJsonSchema }).nullable(),
        questionnaire: z.enum(QUESTIONNAIRES),
        status: z.enum(SURVEY_STATUSES),
      })
      .nullable(),
  }),
) {}
