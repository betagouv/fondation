import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { NominationFileOutcome } from '../../../shared/types/nomination-file-outcome';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { buildMemberName, buildName, buildPosition } from '../helpers/magistrat.helper';
import { findAgendaNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class InternalFindDocsNominationFilesQuery {
  private readonly logger = new Logger(InternalFindDocsNominationFilesQuery.name);

  constructor(
    private readonly db: Db,
    private readonly version: AffectationVersionFinder,
  ) {}

  @Transactional()
  async handle(query: {
    sessionId: string;
    ids?: readonly string[];
  }): Promise<InternalFoundAgendaNominationFiles> {
    if (query.ids) assertPgParams(query.ids);

    const maybeVersion = await this.version.lastPublished({
      sessionId: query.sessionId,
    });

    if (maybeVersion.isNone()) {
      this.logger.warn(`There was no published version available for session ${query.sessionId}`);
      throw new NotFoundException();
    }

    const rows = await this.db.tx.$queryRawTyped(
      findAgendaNominationFilesRawQuery(
        query.sessionId,
        maybeVersion.id,
        (query.ids as string[] | null) ?? null,
      ),
    );

    return { items: await z.array(SqlNominationFilesSchema).parseAsync(rows) };
  }
}

const SqlJurisdictionSchema = z.object({
  id: z.string().trim().nonempty(),
  label: z.string().nonempty(),
});

const SqlFunctionSchema = z.object({
  id: z.string().trim().nonempty(),
  label: z.string().trim().nonempty(),
  labelOneMale: z.string().nullable(),
  labelOneFemale: z.string().nullable(),
  addition: z.string().nullable(),
});

const SqlNominationFilesSchema = z
  .object({
    id: z.uuid(),
    number: z.number().int(),
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    outcomeComment: z.string().trim().nullable(),
    targetPosition: z.object({
      grade: z.enum(GradeEnum),
      jurisdiction: SqlJurisdictionSchema,
      arrondissement: SqlJurisdictionSchema.nullable(),
      function: SqlFunctionSchema,
    }),
    magistrat: z.object({
      id: z.string().nonempty(),
      civility: z.enum(['M.', 'MME']),
      firstName: z.string().trim().nonempty(),
      lastName: z.string().trim().nonempty(),
      marriedName: z.string().trim().nullable(),
      usedName: z.string().trim().nullable(),
      externalId: z.number().int().gt(0),

      position: z.object({
        grade: z.enum(GradeEnum),
        jurisdiction: SqlJurisdictionSchema,
        arrondissement: SqlJurisdictionSchema.nullable(),
        function: SqlFunctionSchema.nullable(),
      }),
    }),
    reporters: z.preprocess(
      (x) => x ?? [],
      z.array(
        z.object({
          id: z.uuid(),
          firstName: z.string().trim().nonempty(),
          lastName: z.string().trim().nonempty(),
          gender: z.enum(GenderEnum),
        }),
      ),
    ),
  })
  .transform((item) => {
    const currentPosition = buildPosition({
      civility: item.magistrat.civility,
      position: item.magistrat.position,
    });

    const targetedPosition = buildPosition({
      civility: item.magistrat.civility,
      position: item.targetPosition,
    });

    const nominationFileOutcome =
      item.outcome === null
        ? null
        : NominationFileOutcome.from({
            outcome: item.outcome,
            comment: item.outcomeComment,
          });

    const reporters = item.reporters.map((u) => ({
      id: u.id,
      gender: u.gender,
      firstName: u.firstName,
      lastName: u.lastName,
      fullTitledName: buildMemberName({
        gender: u.gender,
        firstName: u.firstName,
        lastName: u.lastName,
      }),
    }));

    return {
      reporters,
      id: item.id,
      number: item.number,
      outcome: nominationFileOutcome
        ? {
            value: nominationFileOutcome.outcome,
            comment: nominationFileOutcome.comment,
          }
        : null,

      magistrat: {
        name: buildName(item.magistrat),
        id: item.magistrat.id,
        externalId: item.magistrat.externalId,
        position: {
          grade: item.magistrat.position.grade,
          label: currentPosition,
          functionId: item.magistrat.position.function?.id ?? null,
          jurisdictionId: item.magistrat.position.jurisdiction?.id ?? null,
        },
      },

      targetPosition: {
        grade: item.targetPosition.grade,
        label: targetedPosition,
        functionId: item.targetPosition.function?.id ?? null,
        jurisdictionId: item.targetPosition.jurisdiction?.id ?? null,
      },
    };
  });

export class InternalFoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.looseObject({
        id: z.string(),
        number: z.number(),

        magistrat: z.object({
          id: z.string(),
          externalId: z.number().int().gt(0),
          name: z.string(),
          position: z.object({
            label: z.string().nullable(),
            grade: z.enum(GradeEnum),
            functionId: z.string().nullable(),
            jurisdictionId: z.string().nullable(),
          }),
        }),

        targetPosition: z.object({
          label: z.string().nullable(),
          grade: z.enum(GradeEnum),
          functionId: z.string().nullable(),
          jurisdictionId: z.string().nullable(),
        }),

        reporters: z.array(
          z.object({
            gender: z.enum(GenderEnum),
            firstName: z.string().trim().nonempty(),
            lastName: z.string().trim().nonempty(),
            fullTitledName: z.string().trim().nonempty(),
          }),
        ),
        outcome: z
          .object({
            value: z.enum(NominationFileOutcome.enum),
            comment: z.string().nullable(),
          })
          .nullable(),
      }),
    ),
  }),
) {}
