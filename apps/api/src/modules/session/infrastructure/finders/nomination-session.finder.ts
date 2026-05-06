import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class NominationSessionFinder {
  constructor(private readonly prisma: PrismaService) {}

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
