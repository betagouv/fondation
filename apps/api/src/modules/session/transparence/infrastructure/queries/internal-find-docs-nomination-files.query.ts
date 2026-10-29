import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { findAgendaNominationFilesRawQuery } from '../../../../../generated/prisma/sql';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { Db } from '../../../../framework/database';
import { CIVILITIES, magistratTitledFullName } from '../../../../magistrat/domain/magistrat-name';
import { GenderEnum } from '../../../../shared/gender.enum';
import { GradeEnum } from '../../../../shared/grade.enum';
import { NominationFileOutcome } from '../../../../shared/nomination-file-outcome.enum';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { buildMemberName, buildPosition } from '../helpers/magistrat.helper';

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
      select: { id: true } satisfies Prisma.DossierDeNominationSelect,
      where: {
        sessionId: query.sessionId,
        ...(query.ids ? { id: { in: [...query.ids] } } : {}),
      },
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
      civility: z.enum(CIVILITIES),
      externalId: z.number().int().gt(0),
      firstName: z.string().trim().nonempty(),
      id: z.string().nonempty(),
      lastName: z.string().trim().nonempty(),
      marriedName: z.string().trim().nullable(),
      position: z.object({
        administrativePositionId: z.string().trim().nullable(),
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
      firstName: u.firstName,
      fullTitledName: buildMemberName({
        firstName: u.firstName,
        gender: u.gender,
        lastName: u.lastName,
      }),
      gender: u.gender,
      id: u.id,
      lastName: u.lastName,
    }));

    return {
      id: item.id,
      magistrat: {
        externalId: item.magistrat.externalId,
        id: item.magistrat.id,
        name: magistratTitledFullName(item.magistrat),
        position: {
          functionId: item.magistrat.position.function?.id ?? null,
          grade: item.magistrat.position.grade,
          jurisdictionId: item.magistrat.position.jurisdiction?.id ?? null,
          label: currentPosition,
        },
      },
      number: item.number,
      outcome: nominationFileOutcome
        ? {
            comment: nominationFileOutcome.comment,
            value: nominationFileOutcome.outcome,
          }
        : null,
      reporters,
      targetPosition: {
        functionId: item.targetPosition.function?.id ?? null,
        grade: item.targetPosition.grade,
        jurisdictionId: item.targetPosition.jurisdiction?.id ?? null,
        label: targetedPosition,
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
