import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { UnreportedSessionFilesCountFinder } from '../finders/unreported-transparence-files-count.finder';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/session/shared/types/nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailNominationSessionQuery {
  constructor(
    private readonly db: Db,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly unreportedSessionFilesCountFinder: UnreportedSessionFilesCountFinder,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DetailedNominationSessionDto> {
    const optionalVersion = await this.affectationVersionFinder.last({
      sessionId: query.sessionId,
    });

    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
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
      },
    });

    if (!session) throw new NotFoundException();

    const affectationsCount = session.affectationVersions[0]?._count.affectations ?? 0;
    const isDeletable = session._count.attachments === 0 && affectationsCount === 0;

    const unreportedCount = await this.unreportedSessionFilesCountFinder.find({
      sessionId: query.sessionId,
    });
    const isArchivable = !!session.validatedAt && !session.archivedAt && unreportedCount === 0;

    const formation = prismaFormationEnumToFormationEnum(session.formation);

    return {
      id: session.id,
      name: session.name,
      formation,
      outcomes: NominationFileOutcome.selectableOutcomes(formation),
      observationsClosingDate: DateOnly.fromDate(
        assertIsDefined(
          session.transparenceGds?.observationsClosingDate,
          `${session.id} no observation closing date`,
        ),
      ).toJson(),
      date: DateOnly.fromDate(session.date).toJson(),
      dueDate: DateOnly.fromOptionalDate(session.transparenceGds?.dueDate)?.toJson() ?? null,
      positionStartDate:
        DateOnly.fromOptionalDate(session.transparenceGds?.positionStartDate)?.toJson() ?? null,
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
