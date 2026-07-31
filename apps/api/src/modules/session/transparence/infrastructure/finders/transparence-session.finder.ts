import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';

@Injectable()
export class NominationSessionFinder {
  constructor(private readonly db: Db) {}

  async formation(query: { sessionId: string }): Promise<FormationEnum> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId },
      select: { formation: true },
    });
    if (!session) throw new NotFoundException();

    return prismaFormationEnumToFormationEnum(session.formation);
  }

  async attachmentsCount(query: { sessionId: string }): Promise<number> {
    const count = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: { _count: { select: { attachments: true } } },
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
      },
    });

    return count?.affectationVersions[0]?._count.affectations ?? 0;
  }
}
