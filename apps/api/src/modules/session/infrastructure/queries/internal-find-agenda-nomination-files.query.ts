import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { Gender, Magistrat } from 'shared-models';
import { findAgendaNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { capitalize } from 'src/utils/capitalize';
import z from 'zod';
import { NominationFileOutcome } from '../../domain/nomination-file-outcome';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class InternalFindAgendaNominationFilesQuery {
  private readonly logger = new Logger(
    InternalFindAgendaNominationFilesQuery.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly version: AffectationVersionFinder,
  ) {}

  async handle(query: {
    sessionId: string;
    ids?: readonly string[];
  }): Promise<InternalFoundAgendaNominationFiles> {
    if ('ids' in query && (query.ids ?? []).length > 32_000) {
      this.logger.error(
        `Received ${(query.ids ?? []).length} ids to search. Limited to 32000`,
      );
      throw new BadRequestException();
    }

    const rows = await this.prisma.$transaction(async (tx) => {
      const maybeVersion = await this.version.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

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
    outcome: z.enum(NominationFileOutcome.enum),
    outcomeComment: z.string().trim().nullable(),
    targetPosition: z.object({
      grade: z.enum(Magistrat.Grade),
      jurisdiction: SqlJurisdictionSchema,
      function: SqlFunctionSchema,
    }),
    magistrat: z.object({
      id: z.string().nonempty(),
      civility: z.enum(['M.', 'MME']),
      firstName: z.string().trim().nonempty(),
      lastName: z.string().trim().nonempty(),
      marriedName: z.string().trim().nullable(),
      usedName: z.string().trim().nullable(),

      position: z.object({
        grade: z.enum(Magistrat.Grade),
        jurisdiction: SqlJurisdictionSchema,
        function: SqlFunctionSchema,
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

    const nominationFileOutcome = NominationFileOutcome.from({
      outcome: item.outcome,
      comment: item.outcomeComment,
    });

    const reporters = item.reporters.map((u) =>
      buildName({
        civility: u.gender === Gender.M ? 'M.' : 'MME',
        firstName: u.firstName,
        lastName: u.lastName,
        usedName: null,
      }),
    );

    return {
      reporters,
      currentPosition,
      targetedPosition,
      id: item.id,
      number: item.number,
      magistratId: item.magistrat.id,
      name: buildName(item.magistrat),
      grade: item.magistrat.position.grade,
      targetedGrade: item.targetPosition.grade,
      outcome: {
        value: nominationFileOutcome.outcome,
        comment: nominationFileOutcome.comment,
      },
    };
  });

function buildName(options: {
  civility: 'M.' | 'MME';
  firstName: string;
  lastName: string;
  usedName: string | null;
}): string {
  return `${options.civility === 'MME' ? 'Mme' : 'M.'} ${capitalize(options.firstName)}\u00A0${(options.usedName || options.lastName).toUpperCase()}`;
}

function buildPosition(options: {
  civility: 'M.' | 'MME';
  position: {
    jurisdiction: { label: string };
    function: {
      label: string;
      labelOneMale: string | null;
      labelOneFemale: string | null;
      addition: string | null;
    };
  };
}): string {
  const { civility, position } = options;
  if (
    (civility === 'M.' && !position.function.labelOneMale) ||
    (civility === 'MME' && !position.function.labelOneFemale)
  ) {
    return `${position.function.label}, ${position.jurisdiction.label}`;
  }

  let label: string;
  if (civility === 'M.') {
    label = position.function.labelOneMale!;
  } else {
    label = position.function.labelOneFemale!;
  }

  const codejur =
    position.jurisdiction.label[0]!.toLowerCase() +
    position.jurisdiction.label.slice(1);

  const jurisdiction = position.function.addition
    ? ' ' + position.function.addition.replace('{codejur}', codejur)
    : `, ${position.jurisdiction.label}`;

  return label[0]!.toUpperCase() + label.slice(1) + jurisdiction;
}

export class InternalFoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.looseObject({
        currentPosition: z.string(),
        grade: z.enum(Magistrat.Grade),
        id: z.string(),
        magistratId: z.string().nullable(),
        name: z.string(),
        number: z.number(),
        targetedGrade: z.enum(Magistrat.Grade),
        targetedPosition: z.string(),
        reporters: z.array(z.string()),
        outcome: z.object({
          value: z.enum(NominationFileOutcome.enum),
          comment: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}
