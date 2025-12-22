import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';
import z from 'zod';

@Injectable()
export class DetailNominationSessionQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
  }): Promise<DetailedNominationSessionDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId },
      select: {
        id: true,
        name: true,
        date: true,
        observationsClosingDate: true,
        dueDate: true,
        positionStartDate: true,
        formation: true,
        typeDeSaisine: true,
      },
    });

    if (!session) throw new NotFoundException();

    return {
      id: session.id,
      name: session.name,
      formation: prismaFormationEnumToFormationEnum(session.formation),
      observationsClosingDate: DateOnly.fromDate(
        session.observationsClosingDate,
      ).toJson(),
      date: DateOnly.fromDate(session.date).toJson(),
      dueDate: session.dueDate
        ? DateOnly.fromDate(session.dueDate).toJson()
        : null,
      positionStartDate: session.positionStartDate
        ? DateOnly.fromDate(session.positionStartDate).toJson()
        : null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(
        session.typeDeSaisine,
      ),
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
  }),
) {}
