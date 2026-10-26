import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly } from '../../../../../utils/date-only';
import { Db } from '../../../../framework/database';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from '../../../../shared/mappers/type-de-saisine-enum.mapper';
import { canReadSession } from '../../../../shared/policies/session.policies';
import type { RoleEnum } from '../../../../shared/role.enum';
import { TypeDeSaisineEnum } from '../../../../shared/type-de-saisine.enum';

export type NominationSessionState = 'ARCHIVED' | 'DELETED' | 'OPEN';

export type FoundNominationSession = {
  date: DateOnly;
  formation: FormationEnum;
  id: string;
  isArchived: boolean;
  name: string;
  typeDeSaisine: TypeDeSaisineEnum;
};

@Injectable()
export class NominationSessionFinder {
  constructor(private readonly db: Db) {}

  async state(query: { sessionId: string }): Promise<NominationSessionState> {
    const session = await this.db.tx.session.findUnique({
      select: { archivedAt: true, deletedAt: true } satisfies Prisma.SessionSelect,
      where: { id: query.sessionId },
    });
    if (!session) throw new NotFoundException();

    if (session.deletedAt) return 'DELETED';
    if (session.archivedAt) return 'ARCHIVED';
    return 'OPEN';
  }

  /** deleted sessions are left out */
  async find(query: { sessionIds: readonly string[] }): Promise<Map<string, FoundNominationSession>> {
    const sessions = await this.db.tx.session.findMany({
      select: {
        archivedAt: true,
        date: true,
        formation: true,
        id: true,
        name: true,
        typeDeSaisine: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: { in: [...query.sessionIds] } },
    });

    return new Map(
      sessions.map((session) => [
        session.id,
        {
          date: DateOnly.fromUtcDate(session.date),
          formation: prismaFormationEnumToFormationEnum(session.formation),
          id: session.id,
          isArchived: session.archivedAt !== null,
          name: session.name,
          typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(session.typeDeSaisine),
        },
      ]),
    );
  }

  async getVisible(query: { role: RoleEnum; sessionId: string }): Promise<FoundNominationSession> {
    const sessions = await this.find({ sessionIds: [query.sessionId] });
    const session = sessions.get(query.sessionId);
    if (!session || !canReadSession(session, query)) throw new NotFoundException();

    return session;
  }

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
