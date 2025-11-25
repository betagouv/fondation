import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { startOfYear } from 'date-fns';
import { Magistrat } from 'shared-models';
import z from 'zod';

import { type DossierDeNomination } from 'src/generated/prisma/client';

import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from 'src/modules/session/domain/auto-affectations';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/nomination-file-content.schema';

import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isDefined } from 'src/utils/is-defined';

import { Clock } from 'src/modules/framework/clock';

@Injectable()
export class AutoAffectationsFinder {
  readonly logger = new Logger(AutoAffectationsFinder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
    private readonly clock: Clock,
  ) {}

  async find(predicate: {
    sessionId: string;
    nominationFileIds: readonly string[];
  }): Promise<AutoAffectations> {
    const session = await this.prisma.session.findUnique({
      where: { id: predicate.sessionId },
      select: {
        formation: true,
        dossierDeNominations: {
          where: {
            id: { in: predicate.nominationFileIds as string[] },
            reporterIds: { none: {} },
          },
        },
      },
    });

    if (!session) throw new NotFoundException();

    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const members = await this.findMembers(formation);
    const files = await this.findNominationFiles(
      session.dossierDeNominations,
      formation,
    );

    return AutoAffectations.from({ files, members });
  }

  private async findNominationFiles(
    dossierDeNominations: readonly DossierDeNomination[],
    formation: Magistrat.Formation,
  ): Promise<AutoAffectationNominationFile[]> {
    const nominationFileContents = await z
      .array(
        z.looseObject({ id: z.string(), content: NominationFileContentSchema }),
      )
      .parseAsync(dossierDeNominations);

    return nominationFileContents
      .map(({ id, content }) => {
        const jurisdiction = this.extractJurisdiction(content.posteCible);
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
  private extractJurisdiction(posteCible: string) {
    const keywords = ['TJ', 'CA'];
    const keyword = keywords.find((k) => posteCible.includes(k));

    if (!keyword) {
      this.logger.debug(`No jurisdiction keyword found in: ${posteCible}`);
      return null;
    }

    const startIndex = posteCible.indexOf(keyword);
    const dashIndex = posteCible.indexOf('-', startIndex);

    return dashIndex > -1
      ? posteCible.substring(startIndex, dashIndex).trim()
      : posteCible.substring(startIndex).trim();
  }
}
