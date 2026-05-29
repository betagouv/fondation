import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class InternalFindNominationFilesLinkedDocsQuery {
  private readonly logger = new Logger(InternalFindNominationFilesLinkedDocsQuery.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    tx?: Prisma.TransactionClient;
    nominationFileIds: Set<string>;
  }): Promise<InternalFoundNominationFilesLinkedDocsDto> {
    assertPgParams(query.nominationFileIds);

    if (!query.tx) {
      return this.prisma.$transaction(async (tx) => this.handle({ ...query, tx }));
    }

    const found = await query.tx.agendaNominationFile.findMany({
      where: { nominationFileId: { in: Array.from(query.nominationFileIds) } },
      select: {
        nominationFileId: true,
        agenda: {
          select: {
            id: true,
            officialReportId: true,
            justicePresentationPlanId: true,
          },
        },
      },
    });

    const items: InternalFoundNominationFilesLinkedDocsDto['items'] = new Map();
    for (const { agenda, nominationFileId } of found) {
      if (!nominationFileId) continue;

      items.set(nominationFileId, {
        isLinkedToAgenda: !!agenda,
        isLinkedToOfficialReport: !!agenda?.officialReportId,
        isLinkedToPresentationPlan: !!agenda?.justicePresentationPlanId,
      });
    }

    return { items };
  }
}

export class InternalFoundNominationFilesLinkedDocsDto {
  items: Map<
    string,
    {
      isLinkedToAgenda: boolean;
      isLinkedToOfficialReport: boolean;
      isLinkedToPresentationPlan: boolean;
    }
  >;
}
