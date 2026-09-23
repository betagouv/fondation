import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';

@Injectable()
export class NominationSessionFinder {
  constructor(private readonly db: Db) {}

  async formation(query: { sessionId: string }): Promise<FormationEnum> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId },
      select: { formation: true } satisfies Prisma.SessionSelect,
    });
    if (!session) throw new NotFoundException();

    return prismaFormationEnumToFormationEnum(session.formation);
  }

  async comments(query: { sessionIds: readonly string[] }): Promise<Map<string, string | null>> {
    const sessions = await this.db.tx.session.findMany({
      select: { comment: true, id: true } satisfies Prisma.SessionSelect,
      where: { id: { in: [...query.sessionIds] } },
    });

    return new Map(sessions.map(({ comment, id }) => [id, comment] as const));
  }

  async attachmentsCount(query: { sessionId: string }): Promise<number> {
    const count = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: { _count: { select: { attachments: true } } } satisfies Prisma.SessionSelect,
    });

    return count?._count.attachments ?? 0;
  }

  async affectedReportersCount(query: { sessionId: string; versionId: string | undefined }): Promise<number> {
    if (!query.versionId) return 0;

    const count = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        affectationVersions: {
          where: { id: query.versionId },
          select: {
            _count: { select: { affectations: true } },
          },
        },
      } satisfies Prisma.SessionSelect,
    });

    return count?.affectationVersions[0]?._count.affectations ?? 0;
  }
}
