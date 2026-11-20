import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { Db } from '../../../../framework/database';

import { ReportedSessionsFinder } from './reported-sessions.finder';

// a session not validated yet is new (TO_VALIDATE), as in the sessions list
export const SESSION_STATUSES = ['TO_VALIDATE', 'ONGOING', 'REPORTED', 'ARCHIVED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

@Injectable()
export class SessionStatusesFinder {
  constructor(
    private readonly db: Db,
    private readonly reportedSessions: ReportedSessionsFinder,
  ) {}

  @Transactional()
  async find(query: { sessionIds: readonly string[] }): Promise<Map<string, SessionStatus>> {
    assertPgParams(query.sessionIds);

    const sessions = await this.db.tx.session.findMany({
      select: { archivedAt: true, id: true, validatedAt: true } satisfies Prisma.SessionSelect,
      where: { id: { in: [...query.sessionIds] } },
    });
    const reportedIds = await this.reportedSessions.reportedSessionIds({
      sessionIds: sessions.map(({ id }) => id),
    });

    return new Map(sessions.map((session) => [session.id, sessionStatus(session, reportedIds)]));
  }
}

function sessionStatus(
  session: { archivedAt: Date | null; id: string; validatedAt: Date | null },
  reportedIds: ReadonlySet<string>,
): SessionStatus {
  if (session.archivedAt) return 'ARCHIVED';
  if (!session.validatedAt) return 'TO_VALIDATE';
  if (reportedIds.has(session.id)) return 'REPORTED';
  return 'ONGOING';
}
