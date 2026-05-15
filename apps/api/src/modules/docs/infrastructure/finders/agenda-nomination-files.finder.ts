import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Magistrat } from 'shared-models';

import {
  findAlreadyReportedNominationFilesRawQuery,
  findNominationFilesNotInAgendaRawQuery,
} from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
import {
  DOC_NOMINATION_FILE_OUTCOME_ENUM,
  DocNominationFileOutcomeEnum,
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
    const { items: sessionNominationFiles } = (await this.sessions.internalFindAgendaNominationFiles({
      ids: query.ids,
      sessionId: query.sessionId,
    })) as FoundAgendaNominationFiles;

    if (sessionNominationFiles.length === 0) return { items: [] };

    const sessionNominationFilesNotInAgenda = await Sentry.startSpan(
      {
        name: 'fr.csm.fondation:docs:findNominationFilesWithAgendaCountRawQuery',
      },
      () =>
        this.prisma.$queryRawTyped(
          findNominationFilesNotInAgendaRawQuery(
            sessionNominationFiles.map(({ id }) => id),
            query.ignoreAgendaId ?? null,
          ),
        ),
    );

    const notReportedFileIds = new Set(sessionNominationFilesNotInAgenda.map(({ id }) => id));
    const output = sessionNominationFiles.flatMap((file) => {
      if (!file.outcome) return [file];

      const outcomeValue = nominationFileOutcomeToDocNominationFileOutcome(file.outcome.value);

      if (!notReportedFileIds.has(file.id) && outcomeValue !== 'SUSPENDED') return [];

      file.outcome.value = outcomeValue;
      return [file];
    });

    return { items: output };
  }

  async findAlreadyReportedIds(query: {
    fileIds: Set<string>;
    ignoreAgendaId?: string;
  }): Promise<
    Map<
      string,
      { id: string; reportedIn: { agendaId: string; outcome: DocNominationFileOutcomeEnum | null }[] }
    >
  > {
    const files = await this.prisma.$queryRawTyped(
      findAlreadyReportedNominationFilesRawQuery([...query.fileIds], query.ignoreAgendaId ?? null),
    );

    const map = new Map<
      string,
      { id: string; reportedIn: { agendaId: string; outcome: DocNominationFileOutcomeEnum | null }[] }
    >();

    for (const file of files) {
      if (!file.nominationFileId) continue;

      const previous = map.get(file.nominationFileId);
      if (previous) {
        previous.reportedIn.push({ agendaId: file.agendaId, outcome: file.outcome });
      } else {
        map.set(file.nominationFileId, {
          id: file.nominationFileId,
          reportedIn: [{ agendaId: file.agendaId, outcome: file.outcome }],
        });
      }
    }

    return map;
  }
}

export class FoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        number: z.number(),
        reporters: z.array(
          z.object({
            id: z.string(),
            gender: z.enum(Gender),
            firstName: z.string(),
            lastName: z.string(),
            fullTitledName: z.string(),
          }),
        ),
        outcome: z
          .object({
            value: z.enum(DOC_NOMINATION_FILE_OUTCOME_ENUM),
            comment: z.string().nullable(),
          })
          .nullable(),

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
      }),
    ),
  }),
) {}
