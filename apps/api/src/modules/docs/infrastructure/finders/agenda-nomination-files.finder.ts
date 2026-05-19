import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Magistrat } from 'shared-models';

import {
  DOC_NOMINATION_FILE_OUTCOME_ENUM,
  nominationFileOutcomeToDocNominationFileOutcome,
} from '../../domain/doc-nomination-file-outcome';
import { ReportedNominationFilesCollection } from '../../domain/reported-nomination-files-collection';
import { findAlreadyReportedNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class AgendaNominationFilesFinder {
  constructor(
    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  async find(query: { sessionId: string; ids?: readonly string[] }): Promise<FoundAgendaNominationFiles> {
    const { items: sessionNominationFiles } = (await this.sessions.internalFindAgendaNominationFiles({
      ids: query.ids,
      sessionId: query.sessionId,
    })) as FoundAgendaNominationFiles;
    if (sessionNominationFiles.length === 0) return { items: [] };

    const output = sessionNominationFiles.map((file) => {
      if (!file.outcome) return file;

      file.outcome.value = nominationFileOutcomeToDocNominationFileOutcome(file.outcome.value);
      return file;
    });

    return { items: output };
  }

  async findReportedNominationFilesCollection(query: {
    fileIds: Set<string>;
    ignoreAgendaId?: string;
  }): Promise<ReportedNominationFilesCollection> {
    const files = await this.prisma.$queryRawTyped(
      findAlreadyReportedNominationFilesRawQuery([...query.fileIds], query.ignoreAgendaId ?? null),
    );

    return ReportedNominationFilesCollection.from({
      reports: files.filter((file): file is typeof file & { nominationFileId: string } =>
        isDefined(file.nominationFileId),
      ),
    });
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
