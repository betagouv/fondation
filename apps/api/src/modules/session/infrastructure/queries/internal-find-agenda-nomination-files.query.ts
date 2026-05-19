import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Magistrat } from 'shared-models';

import { NominationFileOutcome } from '../../domain/nomination-file-outcome';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { buildName, buildPosition } from '../helpers/magistrat.helper';
import { findAgendaNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class InternalFindAgendaNominationFilesQuery {
  private readonly logger = new Logger(InternalFindAgendaNominationFilesQuery.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly version: AffectationVersionFinder,
  ) {}

  async handle(query: {
    sessionId: string;
    ids?: readonly string[];
  }): Promise<InternalFoundAgendaNominationFiles> {
    if ('ids' in query && (query.ids ?? []).length > 32_000) {
      this.logger.error(`Received ${(query.ids ?? []).length} ids to search. Limited to 32000`);
      throw new BadRequestException();
    }

    const rows = await this.prisma.$transaction(async (tx) => {
      const maybeVersion = await this.version.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

      if (maybeVersion.isNone()) {
        this.logger.warn(`There was no published version available for session ${query.sessionId}`);
        throw new NotFoundException();
      }

      return tx.$queryRawTyped(
        findAgendaNominationFilesRawQuery(
          query.sessionId,
          maybeVersion.id,
          (query.ids as string[] | null) ?? null,
        ),
      );
    });

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
      grade: z.enum(Magistrat.Grade),
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
        grade: z.enum(Magistrat.Grade),
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
          gender: z.enum(Gender),
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
      fullTitledName: buildName({
        civility: u.gender === Gender.M ? 'M.' : 'MME',
        firstName: u.firstName,
        lastName: u.lastName,
        usedName: null,
      }),
    }));

    const name = buildName(item.magistrat);

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
        name,
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

      /** deprecated */
      name,
      /** deprecated */
      currentPosition,
      /** deprecated */
      targetedPosition,
      /** deprecated */
      magistratId: item.magistrat.id,
      /** deprecated */
      grade: item.magistrat.position.grade,
      /** deprecated */
      targetedGrade: item.targetPosition.grade,
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
            grade: z.enum(Magistrat.Grade),
            functionId: z.string().nullable(),
            jurisdictionId: z.string().nullable(),
          }),
        }),

        targetPosition: z.object({
          label: z.string().nullable(),
          grade: z.enum(Magistrat.Grade),
          functionId: z.string().nullable(),
          jurisdictionId: z.string().nullable(),
        }),

        reporters: z.array(
          z.object({
            gender: z.enum(Gender),
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
