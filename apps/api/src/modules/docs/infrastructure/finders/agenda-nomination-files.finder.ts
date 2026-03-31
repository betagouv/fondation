import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Magistrat } from 'shared-models';
import { findNominationFilesWithAgendaCountRawQuery } from 'src/generated/prisma/sql';
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
  }): Promise<FoundAgendaNominationFiles> {
    const { items }: FoundAgendaNominationFiles =
      (await this.sessions.internalFindAgendaNominationFiles(query)) as any;
    if (items.length === 0) return { items: [] };

    const rows = await Sentry.startSpan(
      {
        name: 'fr.csm.fondation:docs:findNominationFilesWithAgendaCountRawQuery',
      },
      () =>
        this.prisma.$queryRawTyped(
          findNominationFilesWithAgendaCountRawQuery(items.map(({ id }) => id)),
        ),
    );

    const perId = new Map(
      rows.map(({ id, count }) => [id, Number(count)] as const),
    );

    for (const item of items) {
      item.agendaCount = perId.get(item.id) ?? 0;
      item.outcome.value = nominationFileOutcomeToAgendaNominationFileOutcome(
        item.outcome.value,
      );
    }

    return { items };
  }
}

export class FoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        agendaCount: z.number(),
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
