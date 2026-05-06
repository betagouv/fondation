import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class DetailNominationSessionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<DetailedNominationSessionDto> {
    const session = await this.prisma.$transaction(async (tx) => {
      const optionalVersion = await this.affectationVersionFinder.last({
        sessionId: query.sessionId,
        tx,
      });

      return this.prisma.session.findUnique({
        where: { id: query.sessionId, deletedAt: null },
        select: {
          id: true,
          name: true,
          date: true,
          observationsClosingDate: true,
          dueDate: true,
          positionStartDate: true,
          formation: true,
          typeDeSaisine: true,
          isValidated: true,

          _count: { select: { attachments: true } },

          affectationVersions: {
            where: { id: optionalVersion.optionalId },
            select: {
              _count: { select: { affectations: true } },
            },
          },
        },
      });
    });

    if (!session) throw new NotFoundException();

    const affectationsCount = session.affectationVersions[0]?._count.affectations ?? 0;
    const isDeletable = session._count.attachments === 0 && affectationsCount === 0;

    return {
      id: session.id,
      name: session.name,
      formation: prismaFormationEnumToFormationEnum(session.formation),
      observationsClosingDate: DateOnly.fromDate(session.observationsClosingDate).toJson(),
      date: DateOnly.fromDate(session.date).toJson(),
      dueDate: session.dueDate ? DateOnly.fromDate(session.dueDate).toJson() : null,
      positionStartDate: session.positionStartDate
        ? DateOnly.fromDate(session.positionStartDate).toJson()
        : null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(session.typeDeSaisine),
      isValidated: session.isValidated,
      isDeletable,
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
  }),
) {}
