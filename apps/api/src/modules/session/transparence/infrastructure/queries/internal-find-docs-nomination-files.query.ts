import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { buildMemberName, buildPosition } from '../helpers/magistrat.helper';
import { Prisma } from 'src/generated/prisma/client';
import { findAgendaNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { magistratTitledFullName } from 'src/modules/magistrat/domain/magistrat-name';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class InternalFindDocsNominationFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly version: AffectationVersionFinder,
  ) {}

  @Transactional()
  async handle(query: {
    ids?: readonly string[];
    sessionId: string;
  }): Promise<InternalFoundAgendaNominationFiles> {
    if (query.ids) assertPgParams(query.ids);

    // the agenda prints the published reporters only: before any publication, it prints none
    const maybeVersion = await this.version.lastPublished({
      sessionId: query.sessionId,
    });

    const rows = await this.db.tx.$queryRawTyped(
      findAgendaNominationFilesRawQuery(
        query.sessionId,
        maybeVersion.optionalId ?? null,
        (query.ids as string[] | null) ?? null,
      ),
    );

    const items = await z.array(SqlNominationFilesSchema).parseAsync(rows);
    const identified = new Set(items.map(({ id }) => id));
    const sessionFiles = await this.db.tx.dossierDeNomination.findMany({
      where: {
        sessionId: query.sessionId,
        ...(query.ids ? { id: { in: [...query.ids] } } : {}),
      },
      select: { id: true } satisfies Prisma.DossierDeNominationSelect,
    });

    return {
      items,
      unidentifiedIds: sessionFiles.flatMap(({ id }) => (identified.has(id) ? [] : [id])),
    };
  }
}

const SqlJurisdictionSchema = z.object({
  id: z.string().trim().nonempty(),
  label: z.string().nonempty(),
});

const SqlFunctionSchema = z.object({
  addition: z.string().nullable(),
  id: z.string().trim().nonempty(),
  label: z.string().trim().nonempty(),
  labelOneFemale: z.string().nullable(),
  labelOneMale: z.string().nullable(),
});

const SqlNominationFilesSchema = z
  .object({
    id: z.uuid(),
    magistrat: z.object({
      civility: z.enum(['M.', 'MME']),
      externalId: z.number().int().gt(0),
      firstName: z.string().trim().nonempty(),
      id: z.string().nonempty(),
      lastName: z.string().trim().nonempty(),
      marriedName: z.string().trim().nullable(),
      position: z.object({
        arrondissement: SqlJurisdictionSchema.nullable(),
        function: SqlFunctionSchema.nullable(),
        grade: z.enum(GradeEnum),
        jurisdiction: SqlJurisdictionSchema,
      }),
      usedName: z.string().trim().nullable(),
    }),
    number: z.number().int(),
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    outcomeComment: z.string().trim().nullable(),
    reporters: z.preprocess(
      (x) => x ?? [],
      z.array(
        z.object({
          firstName: z.string().trim().nonempty(),
          gender: z.enum(GenderEnum),
          id: z.uuid(),
          lastName: z.string().trim().nonempty(),
        }),
      ),
    ),
    targetPosition: z.object({
      arrondissement: SqlJurisdictionSchema.nullable(),
      function: SqlFunctionSchema,
      grade: z.enum(GradeEnum),
      jurisdiction: SqlJurisdictionSchema,
    }),
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
            comment: item.outcomeComment,
            outcome: item.outcome,
          });

    const reporters = item.reporters.map((u) => ({
      id: u.id,
      gender: u.gender,
      firstName: u.firstName,
      lastName: u.lastName,
      fullTitledName: buildMemberName({
        firstName: u.firstName,
        gender: u.gender,
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
        name: magistratTitledFullName(item.magistrat),
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
            id: z.string(),
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

    unidentifiedIds: z.array(z.uuid()),
  }),
) {}
