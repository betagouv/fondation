import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrioriteEnum } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/nomination-file-content.schema';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';

@Injectable()
export class ListNominationFilesQuery {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: paginate, sort, filter...
  async handle(query: {
    sessionId: string;
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<{ items: NominationFileAffectationItem[] }> {
    const files = await this.prisma.dossierDeNomination.findMany({
      where: {
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
      },
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
      reporters: x.reporterIds.map(({ user: { id, firstName, lastName } }) => ({
        id,
        firstName,
        lastName,
      })),
    }));

    const items = await z
      .array(NominationFileAffectationItemSchema)
      .parseAsync(partialItems);

    return { items };
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
