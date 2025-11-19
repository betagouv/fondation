import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { Affectations, Candidate, Member } from '../domain/affectation';
import { startOfYear } from 'date-fns';

@Injectable()
export class AffectationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
    private readonly clock: DateTimeProvider,
  ) {}

  async findByNominationFileIds(
    sessionId: string,
    nominationFileIds: readonly string[],
  ): Promise<{ members: Member[]; candidates: Candidate[] }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        formation: true,
        dossierDeNominations: {
          where: {
            id: { in: nominationFileIds as string[] },
            reporterIds: { none: {} },
          },
        },
      },
    });

    if (!session) throw new NotFoundException();

    const memberIds = await this.membersService.findMembers({
      ids: undefined,
      formation: prismaFormationEnumToFormationEnum(session.formation),
    });

    const jurisdiction = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        excludedJurisdictionIds: {
          select: { jurisdictionId: true },
        },
      },
    });

    const excludedJurisdictionIdByMemberId = new Map(
      jurisdiction.map(
        (x) =>
          [
            x.id,
            x.excludedJurisdictionIds.map(
              ({ jurisdictionId }) => jurisdictionId,
            ),
          ] as const,
      ),
    );

    const reportCounts = await this.prisma.report.groupBy({
      by: ['reporterId'],
      _count: { _all: true },
      where: {
        reporterId: { in: memberIds },
        createdAt: { gte: startOfYear(this.clock.now()) },
      },
    });

    const reportCountByMemberId = new Map(
      reportCounts.map(
        ({ reporterId, _count }) => [reporterId, _count._all] as const,
      ),
    );

    const members = memberIds.map((id) => {
      const exludedJurisdictions = new Set<string>(
        excludedJurisdictionIdByMemberId.get(id) ?? [],
      );
      const pastReportContributionsCount = reportCountByMemberId.get(id) ?? 0;

      return Member.from({
        formation: prismaFormationEnumToFormationEnum(session.formation),
        jurisdiction: exludedJurisdictions,
        pastReportContributionsCount,
      });
    });

    // TODO: map candidates from dossier de nomination
    return { members, candidates: [] };
  }
}
