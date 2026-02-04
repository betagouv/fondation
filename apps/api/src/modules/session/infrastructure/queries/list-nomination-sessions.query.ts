import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class ListNominationSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisine;
  }): Promise<ListedNominationSessionsDto> {
    const sessions = await this.prisma.session.findMany({
      where: { typeDeSaisine: query.typeDeSaisine },
      orderBy: [{ date: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        formation: true,
        date: true,
        dueDate: true,
        typeDeSaisine: true,
      },
    });

    return {
      items: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        formation: prismaFormationEnumToFormationEnum(s.formation),
        date: DateOnly.fromDate(s.date).toJson(),
        dueDate: s.dueDate ? DateOnly.fromDate(s.dueDate).toJson() : null,
        typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
      })),
    };
  }
}

export class ListedNominationSessionsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        formation: z.enum(Magistrat.Formation),
        date: dateOnlyJsonSchema,
        dueDate: dateOnlyJsonSchema.nullable(),
        typeDeSaisine: z.enum(TypeDeSaisine),
      }),
    ),
  }),
) {}
