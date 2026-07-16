import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';

@Injectable()
export class NominationSessionFinder {
  constructor(private readonly prisma: PrismaService) {}

  async formation(query: { sessionId: string; tx?: Prisma.TransactionClient }): Promise<FormationEnum> {
    const session = await (query.tx ?? this.prisma).session.findUnique({
      where: { id: query.sessionId },
      select: { formation: true },
    });
    if (!session) throw new NotFoundException();

    return prismaFormationEnumToFormationEnum(session.formation);
  }

  async attachmentsCount(query: { sessionId: string; tx?: Prisma.TransactionClient }): Promise<number> {
    if (!query.tx) {
      return this.prisma.$transaction(async (tx) => this.attachmentsCount({ ...query, tx }));
    }

    const count = await query.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: { _count: { select: { attachments: true } } },
    });

    return count?._count.attachments ?? 0;
  }

  async affectedReportersCount(query: {
    sessionId: string;
    versionId: string | undefined;
    tx?: Prisma.TransactionClient;
  }): Promise<number> {
    if (!query.versionId) return 0;

    if (!query.tx) {
      return this.prisma.$transaction(async (tx) => this.affectedReportersCount({ ...query, tx }));
    }

    const count = await query.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        affectationVersions: {
          where: { id: query.versionId },
          select: {
            _count: { select: { affectations: true } },
          },
        },
      },
    });

    return count?.affectationVersions[0]?._count.affectations ?? 0;
  }
}
