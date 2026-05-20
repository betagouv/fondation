import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Magistrat } from 'shared-models';

import {
  DOC_NOMINATION_FILE_OUTCOME_ENUM,
  nominationFileOutcomeToDocNominationFileOutcome,
} from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';

@Injectable()
export class DocsNominationFilesFinder {
  constructor(
    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,
  ) {}

  async find(query: {
    sessionId: string;
    ids?: readonly string[];
    tx?: Prisma.TransactionClient;
  }): Promise<FoundDocsNominationFiles> {
    const { items: sessionNominationFiles } = (await this.sessions.internalFindNominationFiles({
      tx: query.tx,
      ids: query.ids,
      sessionId: query.sessionId,
    })) as FoundDocsNominationFiles;
    if (sessionNominationFiles.length === 0) return { items: [] };

    const output = sessionNominationFiles.map((file) => {
      if (!file.outcome) return file;

      file.outcome.value = nominationFileOutcomeToDocNominationFileOutcome(file.outcome.value);
      return file;
    });

    return { items: output };
  }
}

export class FoundDocsNominationFiles extends createZodDto(
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
