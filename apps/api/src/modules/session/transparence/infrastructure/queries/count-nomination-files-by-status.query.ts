import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { countNominationFilesByStatusRawQuery } from '../../../../../generated/prisma/sql';
import { Db } from '../../../../framework/database';
import { NominationFileOutcome } from '../../../../shared/nomination-file-outcome.enum';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class CountNominationFilesByStatusQuery {
  constructor(
    private readonly db: Db,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<NominationFilesStatusCountDto> {
    const [counts] = await this.db.withTransaction(async () => {
      const version = await this.versionFinder.last({ sessionId: query.sessionId });

      return this.db.tx.$queryRawTyped(
        countNominationFilesByStatusRawQuery(
          query.sessionId,
          version.optionalId ?? null,
          NominationFileOutcome.nonFinalOutcomes(),
          NominationFileOutcome.finalOutcomes(),
        ),
      );
    });

    return NominationFilesStatusCountDto.schema.parse(counts);
  }
}

export class NominationFilesStatusCountDto extends createZodDto(
  z.object({
    unaffected: z.number(),
    inProgress: z.number(),
    withOutcome: z.number(),
    total: z.number(),
    missingEvaluation: z.number(),
    missingEvaluationWithComment: z.number(),
  }),
) {}
