import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Magistrat } from 'shared-models';
import { findNominationFilesNotInAgendaRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
import {
  AGENDA_NOMINATION_FILE_OUTCOME_ENUM,
  nominationFileOutcomeToAgendaNominationFileOutcome,
} from '../../domain/agenda-nomination-file-outcome';

@Injectable()
export class AgendaNominationFilesFinder {
  constructor(
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
      const outcomeValue = nominationFileOutcomeToAgendaNominationFileOutcome(
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
        agendaCount: z.number().meta({ deprecated: true }),
        currentPosition: z.string().nullable(),
        grade: z.enum(Magistrat.Grade),
        id: z.string(),
        magistratId: z.string().nullable(),
        name: z.string(),
        number: z.number(),
        targetedGrade: z.enum(Magistrat.Grade),
        targetedPosition: z.string().nullable(),
        reporters: z.array(z.string()),
        outcome: z.object({
          value: z.enum(AGENDA_NOMINATION_FILE_OUTCOME_ENUM),
          comment: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}
