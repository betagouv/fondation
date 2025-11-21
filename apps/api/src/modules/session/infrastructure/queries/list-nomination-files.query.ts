import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, PrioriteEnum } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  paginate,
  Paginated,
  Pagination,
} from 'src/modules/framework/pagination';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';

@Injectable()
export class ListNominationFilesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    pagination: Pagination;
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<Paginated<NominationFileAffectationItem>> {
    const { partialItems, nominationFilesCount } =
      await this.prisma.$transaction(async (tx) => {
        const where = {
          sessionId: query.sessionId,
          priorite: {
            in:
              query.filters.priorities.length > 0
                ? query.filters.priorities.map(prioriteEnumToPrismaPrioriteEnum)
                : undefined,
          },
          reporterIds: {
            some: {
              userId: {
                in:
                  query.filters.reporterIds.length > 0
                    ? (query.filters.reporterIds as string[])
                    : undefined,
              },
            },
          },
        } satisfies Prisma.DossierDeNominationWhereInput;

        const nominationFilesCount = await tx.dossierDeNomination.count({
          where,
        });

        const files = await tx.dossierDeNomination.findMany({
          where,
          take: query.pagination.limit,
          skip: (query.pagination.page - 1) * query.pagination.limit,
          select: {
            id: true,
            priorite: true,
            content: true,
            reporterIds: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        });

        const partialItems = files.map((x) => ({
          id: x.id,
          content: x.content,
          priority: x.priorite
            ? prismaPrioriteEnumToPrioriteEnum(x.priorite)
            : null,
          reporters: x.reporterIds.map(
            ({ user: { id, firstName, lastName } }) => ({
              id,
              firstName,
              lastName,
            }),
          ),
        }));

        return { partialItems, nominationFilesCount };
      });

    const items = await z
      .array(NominationFileAffectationItemSchema)
      .parseAsync(partialItems);

    return paginate({
      items,
      totalCount: nominationFilesCount,
      pagination: query.pagination,
    });
  }
}

export const NominationFileContentSchema = z
  .discriminatedUnion('version', [
    z.object({
      version: z.literal(1).nullish(),
      folderNumber: z.number().nullable(),
      name: z.string(),
      formation: z.enum(Magistrat.Formation),
      dueDate: dateOnlyJsonSchema.nullable(),
      grade: z.enum(Magistrat.Grade),
      currentPosition: z.string(),
      targettedPosition: z.string(),
      rank: z.string(),
      birthDate: dateOnlyJsonSchema,
      biography: z.string().nullable(),
      observers: z.array(z.string()).nullable(),
      datePassageAuGrade: dateOnlyJsonSchema.nullable(),
      datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
      informationCarrière: z.string().nullable(),
    }),
    z.object({
      version: z.literal(2),
      numeroDeDossier: z.number().nullable(),
      nomMagistrat: z.string(),
      dateEchéance: dateOnlyJsonSchema.nullable(),
      grade: z.enum(Magistrat.Grade),
      posteActuel: z.string(),
      posteCible: z.string(),
      rang: z.string(),
      dateDeNaissance: dateOnlyJsonSchema,
      historique: z.string().nullable(),
      observants: z.array(z.string()).nullable(),
      datePassageAuGrade: dateOnlyJsonSchema.nullable(),
      datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
      informationCarrière: z.string().nullable(),
    }),
  ])
  .transform((content) =>
    content.version === 2
      ? content
      : {
          version: 2,
          numeroDeDossier: content.folderNumber,
          nomMagistrat: content.name,
          dateEchéance: content.dueDate,
          grade: content.grade,
          posteActuel: content.currentPosition,
          posteCible: content.targettedPosition,
          rang: content.rank,
          dateDeNaissance: content.birthDate,
          historique: content.biography,
          observants: content.observers,
          datePassageAuGrade: content.datePassageAuGrade,
          datePriseDeFonctionPosteActuel:
            content.datePriseDeFonctionPosteActuel,
          informationCarrière: content.informationCarrière,
        },
  );

const NominationFileAffectationItemSchema = z.object({
  id: z.string(),
  priority: z.enum(PrioriteEnum).nullable(),
  content: NominationFileContentSchema,
  reporters: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
});

export class NominationFileAffectationItem extends createZodDto(
  NominationFileAffectationItemSchema,
) {}
