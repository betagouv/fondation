import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrioriteEnum } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  paginate,
  Paginated,
  Pagination,
} from 'src/modules/framework/pagination';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/nomination-file-content.schema';
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
