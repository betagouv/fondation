import { NotFoundException } from '@nestjs/common';
import { startOfYear } from 'date-fns';
import { Magistrat } from 'shared-models';
import { DossierDeNomination } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';

import { Candidate, Member } from 'src/modules/nomination/domain/affectation';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/queries/list-nomination-files.query';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';

export class ListAutoAffectationQuery {
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

    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const members = await this.buildMembers(formation);
    const candidates = this.buildCandidates(
      session.dossierDeNominations,
      formation,
    );
    return { members, candidates };
  }

  private buildCandidates(
    dossierDeNominations: readonly DossierDeNomination[],
    formation: Magistrat.Formation,
  ): Candidate[] {
    return dossierDeNominations
      .map((dossier) => {
        // Cas 1 : Parsing manuel
        // TODO 2 : récupérer la juridiction du membre une fois la migration XML terminée
        const { posteCible } = NominationFileContentSchema.parse(
          dossier.content,
        );
        const keywords = ['TJ', 'CA'];
        const keyword = keywords.find((k) => posteCible.includes(k));

        if (!keyword) {
          console.warn(`No jurisdiction keyword found in: ${posteCible}`);
          return null;
        }

        // Extraire depuis le keyword jusqu'au "-" -1 pour trim
        const startIndex = posteCible.indexOf(keyword);
        const dashIndex = posteCible.indexOf('-', startIndex);

        const jurisdictionTarget =
          dashIndex > -1
            ? posteCible.substring(startIndex, dashIndex).trim()
            : posteCible.substring(startIndex).trim();

        return {
          jurisdictionTarget,
          formation,
          nominationSessionFileId: dossier.id,
        } satisfies Candidate;
      })
      .filter((c): c is Candidate => c !== null);
  }

  private async buildMembers(
    formation: Magistrat.Formation,
  ): Promise<Member[]> {
    const memberIds = await this.membersService.findMembers({
      ids: undefined,
      formation,
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

    return memberIds.map((id) => {
      const exludedJurisdictions = new Set<string>(
        excludedJurisdictionIdByMemberId.get(id) ?? [],
      );
      const pastReportContributionsCount = reportCountByMemberId.get(id) ?? 0;

      return Member.from({
        formation,
        forbiddenJurisdiction: exludedJurisdictions,
        pastReportContributionsCount,
        id,
      });
    });
  }
}
