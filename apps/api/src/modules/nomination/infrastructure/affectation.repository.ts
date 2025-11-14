import { Injectable } from '@nestjs/common';
import { startOfYear } from 'date-fns';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { Db } from 'src/modules/framework/drizzle';
import {
  affectationPm,
  dossierDeNominationPm,
  reports,
  sessionPm,
} from 'src/modules/framework/drizzle/schemas';
import { MEMBER_ROLES } from 'src/modules/members/infrastructure/member.utils';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import z from 'zod';
import { Affectations } from '../domain/affectation';

@Injectable()
export class AffectationRepository {
  // TODO: move to prisma
  constructor(
    private readonly db: Db,
    private readonly clock: DateTimeProvider,
  ) {}

  async findByNominationFileIds(
    sessionId: string,
    nominationFileIds: readonly string[],
  ): Promise<Affectations> {
    await this.db.transaction(async (tx) => {
      const existingAffectations = await this.db.query.affectationPm.findFirst({
        where: (a, { eq }) => eq(a.sessionId, sessionId),
      });

      const members = await tx.query.users.findMany({
        where: (u, { and, inArray }) => and(inArray(u.role, MEMBER_ROLES)),
        with: {
          excludedJurisdictionIds: true,
        },
      });
      const memberIds = members.map(({ id }) => id);

      const pastReportContributionsCountByReportId = await this.db
        .select({
          reporterId: reports.reporterId,
          count: sql<number>`COUNT(*)`,
        })
        .from(reports)
        .where(
          and(
            inArray(reports.reporterId, memberIds),
            gte(reports.createdAt, startOfYear(this.clock.now())),
          ),
        )
        .groupBy(reports.reporterId);
    });
  }
}
