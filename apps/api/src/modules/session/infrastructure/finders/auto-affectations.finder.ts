import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { startOfYear } from 'date-fns';
import { Magistrat } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from 'src/modules/session/domain/auto-affectations';

import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isDefined } from 'src/utils/is-defined';

import { Clock } from 'src/modules/framework/clock';
import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class AutoAffectationsFinder {
  readonly logger = new Logger(AutoAffectationsFinder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
    private readonly clock: Clock,
    private readonly affectationVersionFinder: AffectationVersionFinder,
  ) {}

  async find(predicate: {
    sessionId: string;
    nominationFileIds: readonly string[];
  }): Promise<AutoAffectations> {
    const session = await this.prisma.$transaction(async (tx) => {
      const version = await this.affectationVersionFinder.last({
        sessionId: predicate.sessionId,
        tx,
      });

      return tx.session.findUnique({
        where: { id: predicate.sessionId },
        select: {
          formation: true,
          dossierDeNominations: {
            select: { id: true, targetedPosition: true },
            where: {
              id: { in: predicate.nominationFileIds as string[] },
              reporterIds: {
                none: { versionId: version?.id },
              },
            },
          },
        },
      });
    });

    if (!session) throw new NotFoundException();

    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const members = await this.findMembers(formation);
    const files = await this.extractAutoAffectationNominationFiles(
      session.dossierDeNominations,
      formation,
    );

    return AutoAffectations.from({ files, members });
  }

  private async extractAutoAffectationNominationFiles(
    nominationFiles: readonly { id: string; targetedPosition: string | null }[],
    formation: Magistrat.Formation,
  ): Promise<AutoAffectationNominationFile[]> {
    return nominationFiles
      .map(({ id, targetedPosition }) => {
        const jurisdiction = this.extractJurisdiction(targetedPosition);
        if (!jurisdiction) return null;

        return {
          id,
          formation,
          targetJurisdiction: jurisdiction,
        } satisfies AutoAffectationNominationFile;
      })
      .filter(isDefined);
  }

  private async findMembers(
    formation: Magistrat.Formation,
  ): Promise<AutoAffectationMember[]> {
    const memberIds = await this.membersService.findMembers({
      ids: undefined,
      formation,
    });

    if (memberIds.length === 0) return [];

    const [membersExcludedJurisdictions, reportCounts] =
      // the simple array syntax returns a wrong type for the `groupBy` operation
      await this.prisma.$transaction(async (tx) => {
        const membersExcludedJurisdictions = await tx.user.findMany({
          where: { id: { in: memberIds } },
          select: {
            id: true,
            excludedJurisdictionIds: {
              select: { jurisdictionId: true },
            },
          },
        });

        const reportCounts = await tx.report.groupBy({
          by: ['reporterId'],
          _count: { _all: true },
          where: {
            reporterId: { in: memberIds },
            createdAt: { gte: startOfYear(this.clock.now()) },
          },
        });

        return [membersExcludedJurisdictions, reportCounts] as const;
      });

    const reportCountByMemberId = new Map(
      reportCounts.map(
        ({ reporterId, _count }) => [reporterId, _count._all] as const,
      ),
    );

    const excludedJurisdictionIdByMemberId = new Map(
      membersExcludedJurisdictions.map(
        (x) =>
          [
            x.id,
            x.excludedJurisdictionIds.map(
              ({ jurisdictionId }) => jurisdictionId,
            ),
          ] as const,
      ),
    );

    return memberIds.map((id) => {
      const excludedJurisdictions = new Set<string>(
        excludedJurisdictionIdByMemberId.get(id) ?? [],
      );
      const pastReportContributionsCount = reportCountByMemberId.get(id) ?? 0;

      return AutoAffectationMember.from({
        id,
        formation,
        excludedJurisdictions,
        pastReportContributionsCount,
      });
    });
  }

  // Cas 1 : Parsing manuel
  // TODO 2 : récupérer la juridiction du membre une fois la migration XML terminée
  private extractJurisdiction(targetedPosition: string | null): string | null {
    if (!targetedPosition) return null;

    const keywords = ['TJ', 'CA'];
    const keyword = keywords.find((k) => targetedPosition.includes(k));

    if (!keyword) {
      this.logger.debug(
        `No jurisdiction keyword found in: ${targetedPosition}`,
      );

      return null;
    }

    const startIndex = targetedPosition.indexOf(keyword);
    const dashIndex = targetedPosition.indexOf('-', startIndex);

    return dashIndex > -1
      ? targetedPosition.substring(startIndex, dashIndex).trim()
      : targetedPosition.substring(startIndex).trim();
  }
}
