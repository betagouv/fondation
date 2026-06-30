import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { UnreportedSessionFilesCountFinder } from '../finders/count-unreported-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailNominationSessionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly unreportedSessionFilesCountFinder: UnreportedSessionFilesCountFinder,
  ) {}

  async handle(query: {
    sessionId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<DetailedNominationSessionDto> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.handle({ ...query, tx }));

    const optionalVersion = await this.affectationVersionFinder.last({
      sessionId: query.sessionId,
      tx: query.tx,
    });

    const session = await query.tx.session.findUnique({
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
      tx: query.tx,
    });
    const isArchivable = !!session.validatedAt && !session.archivedAt && unreportedCount === 0;

    return {
      id: session.id,
      name: session.name,
      formation: prismaFormationEnumToFormationEnum(session.formation),
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
    formation: z.enum(Magistrat.Formation),
    date: dateOnlyJsonSchema,
    observationsClosingDate: dateOnlyJsonSchema,
    dueDate: dateOnlyJsonSchema.nullable(),
    positionStartDate: dateOnlyJsonSchema.nullable(),
    typeDeSaisine: z.enum(TypeDeSaisine),
    isValidated: z.boolean(),
    isDeletable: z.boolean(),
    isArchived: z.boolean(),
    isArchivable: z.boolean(),
  }),
) {}
