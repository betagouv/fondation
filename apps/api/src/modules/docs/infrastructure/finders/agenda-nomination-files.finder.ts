import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Magistrat } from 'shared-models';
import { findNominationFilesNotInAgendaRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
import {
  DOC_NOMINATION_FILE_OUTCOME_ENUM,
  nominationFileOutcomeToDocNominationFileOutcome,
} from '../../domain/doc-nomination-file-outcome';

@Injectable()
export class AgendaNominationFilesFinder {
  constructor(
    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  async find(query: {
    sessionId: string;
    ids?: readonly string[];
    ignoreAgendaId?: string;
  }): Promise<FoundAgendaNominationFiles> {
    const { items } = (await this.sessions.internalFindAgendaNominationFiles({
      ids: query.ids,
      sessionId: query.sessionId,
    })) as FoundAgendaNominationFiles;

    if (items.length === 0) return { items: [] };

    const rows = await Sentry.startSpan(
      {
        name: 'fr.csm.fondation:docs:findNominationFilesWithAgendaCountRawQuery',
      },
      () =>
        this.prisma.$queryRawTyped(
          findNominationFilesNotInAgendaRawQuery(
            items.map(({ id }) => id),
            query.ignoreAgendaId ?? null,
          ),
        ),
    );

    const ids = new Set(rows.map(({ id }) => id));
    const output = items.flatMap((item) => {
      const outcomeValue = nominationFileOutcomeToDocNominationFileOutcome(
        item.outcome.value,
      );

      if (!ids.has(item.id) && outcomeValue !== 'SUSPENDED') return [];

      item.agendaCount = 0;
      item.outcome.value = outcomeValue;
      return [item];
    });

    return { items: output };
  }
}

export class FoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        number: z.number(),
        reporters: z.array(z.string()),
        outcome: z.object({
          value: z.enum(DOC_NOMINATION_FILE_OUTCOME_ENUM),
          comment: z.string().nullable(),
        }),

        magistrat: z.object({
          id: z.string(),
          externalId: z.number().int().gt(0),
          name: z.string(),
          position: z.object({
            grade: z.enum(Magistrat.Grade),
            label: z.string(),
            functionId: z.string().nullable(),
            jurisdictionId: z.string().nullable(),
          }),
        }),

        targetPosition: z.object({
          grade: z.enum(Magistrat.Grade),
          label: z.string(),
          functionId: z.string().nullable(),
          jurisdictionId: z.string().nullable(),
        }),

        agendaCount: z.number().meta({ deprecated: true }),
        currentPosition: z.string().nullable().meta({ deprecated: true }),
        grade: z.enum(Magistrat.Grade).meta({ deprecated: true }),
        magistratId: z.string().nullable().meta({ deprecated: true }),
        name: z.string().meta({ deprecated: true }),
        targetedGrade: z.enum(Magistrat.Grade).meta({ deprecated: true }),
        targetedPosition: z.string().nullable().meta({ deprecated: true }),
      }),
    ),
  }),
) {}
