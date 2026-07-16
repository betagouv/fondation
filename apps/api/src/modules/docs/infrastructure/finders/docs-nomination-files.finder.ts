import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender } from 'shared-models';

import {
  DOC_NOMINATION_FILE_OUTCOME_ENUM,
  docNominationFileOutcomeLabel,
  nominationFileOutcomeToDocNominationFileOutcome,
} from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';

import { ReportedNominationFilesFinder } from './reported-nomination-files.finder';

@Injectable()
export class DocsNominationFilesFinder {
  constructor(
    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,

    private readonly reportedNominationFilesFinder: ReportedNominationFilesFinder,
  ) {}

  async find(query: {
    sessionId: string;
    formation?: FormationEnum;
    ids?: readonly string[];
    tx?: Prisma.TransactionClient;
  }): Promise<FoundDocsNominationFiles> {
    const { items: sessionNominationFiles } = (await this.sessions.internalFindNominationFiles({
      tx: query.tx,
      ids: query.ids,
      sessionId: query.sessionId,
    })) as FoundDocsNominationFiles;
    if (sessionNominationFiles.length === 0) return { items: [] };

    const formation =
      query.formation ??
      (await this.sessions.internalGetSessionFormation({ tx: query.tx, sessionId: query.sessionId }));

    const items = sessionNominationFiles.map((file) => {
      if (!file.outcome) return file;

      file.outcome.value = nominationFileOutcomeToDocNominationFileOutcome(file.outcome.value);
      file.outcome.label = docNominationFileOutcomeLabel({ outcome: file.outcome.value, formation });
      return file;
    });

    return { items };
  }

  async findNonReported(query: {
    sessionId: string;
    formation?: FormationEnum;
    ignoreOfficialReportId?: string;
    ids?: readonly string[];
    tx?: Prisma.TransactionClient;
  }): Promise<FoundDocsNominationFiles> {
    const { items: sessionNominationFiles } = await this.find(query);
    if (sessionNominationFiles.length === 0) return { items: [] };

    const fileIds = new Set(sessionNominationFiles.map((f) => f.id));
    const reportedNominationFiles = await this.reportedNominationFilesFinder.find({
      fileIds,
      tx: query.tx,
      ignoreOfficialReportId: query.ignoreOfficialReportId,
    });

    const items = sessionNominationFiles.filter(
      (file) =>
        !reportedNominationFiles.isReported({
          nominationFileId: file.id,
          ignoreOfficialReportId: query.ignoreOfficialReportId,
        }),
    );

    return { items };
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
            label: z.string(),
            comment: z.string().nullable(),
          })
          .nullable(),

        magistrat: z.object({
          id: z.string(),
          externalId: z.number().int().gt(0),
          name: z.string(),
          position: z.object({
            grade: z.enum(GradeEnum),
            label: z.string(),
            functionId: z.string().nullable(),
            jurisdictionId: z.string().nullable(),
          }),
        }),

        targetPosition: z.object({
          grade: z.enum(GradeEnum),
          label: z.string(),
          functionId: z.string().nullable(),
          jurisdictionId: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}
