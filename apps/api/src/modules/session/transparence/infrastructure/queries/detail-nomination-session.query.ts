import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { assertIsDefined } from '../../../../../utils/is-defined';
import { Db } from '../../../../framework/database';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from '../../../../shared/mappers/type-de-saisine-enum.mapper';
import { NominationFileOutcome } from '../../../../shared/nomination-file-outcome.enum';
import { TypeDeSaisineEnum } from '../../../../shared/type-de-saisine.enum';
import { sessionLabel } from '../../domain/session-label';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { ReportedSessionsFinder } from '../finders/reported-sessions.finder';

@Injectable()
export class DetailNominationSessionQuery {
  constructor(
    private readonly db: Db,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly reportedSessionsFinder: ReportedSessionsFinder,
  ) {}

  @Transactional()
  async handle(query: {
    /** undefined means no restriction on the formation */
    formation: FormationEnum | undefined;
    sessionId: string;
  }): Promise<DetailedNominationSessionDto> {
    const optionalVersion = await this.affectationVersionFinder.last({
      sessionId: query.sessionId,
    });

    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null, formation: query.formation },
      select: {
        id: true,
        name: true,
        date: true,
        transparenceGds: {
          select: {
            observationsClosingDate: true,
            dueDate: true,
            positionStartDate: true,
          },
        },
        formation: true,
        typeDeSaisine: true,
        validatedAt: true,
        archivedAt: true,

        _count: { select: { attachments: true } },

        affectationVersions: {
          where: { id: optionalVersion.optionalId },
          select: {
            _count: { select: { affectations: true } },
          },
        },
      } satisfies Prisma.SessionSelect,
    });

    if (!session) throw new NotFoundException();

    const affectationsCount = session.affectationVersions[0]?._count.affectations ?? 0;
    const isDeletable = session._count.attachments === 0 && affectationsCount === 0;

    const unreportedCount = await this.reportedSessionsFinder.unreportedFilesCount({
      sessionId: query.sessionId,
    });
    const isArchivable = !!session.validatedAt && !session.archivedAt && unreportedCount === 0;

    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const date = DateOnly.fromUtcDate(session.date);

    return {
      id: session.id,
      name: session.name,
      label: sessionLabel({ date, name: session.name }),
      formation,
      outcomes: NominationFileOutcome.selectableOutcomes(formation),
      observationsClosingDate: DateOnly.fromUtcDate(
        assertIsDefined(
          session.transparenceGds?.observationsClosingDate,
          `${session.id} no observation closing date`,
        ),
      ).toJson(),
      date: date.toJson(),
      dueDate: DateOnly.fromOptionalUtcDate(session.transparenceGds?.dueDate)?.toJson() ?? null,
      positionStartDate:
        DateOnly.fromOptionalUtcDate(session.transparenceGds?.positionStartDate)?.toJson() ?? null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(session.typeDeSaisine),
      isValidated: session.validatedAt !== null,
      isDeletable,
      isArchived: !!session.archivedAt,
      isArchivable,
    };
  }
}

export class DetailedNominationSessionDto extends createZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    formation: z.enum(FormationEnum),
    outcomes: z.array(
      z.object({
        commentRequired: z.boolean(),
        label: z.string(),
        value: z.enum(NominationFileOutcome.enum),
      }),
    ),
    date: dateOnlyJsonSchema,
    observationsClosingDate: dateOnlyJsonSchema,
    dueDate: dateOnlyJsonSchema.nullable(),
    positionStartDate: dateOnlyJsonSchema.nullable(),
    typeDeSaisine: z.enum(TypeDeSaisineEnum),
    isValidated: z.boolean(),
    isDeletable: z.boolean(),
    isArchived: z.boolean(),
    isArchivable: z.boolean(),
  }),
) {}
