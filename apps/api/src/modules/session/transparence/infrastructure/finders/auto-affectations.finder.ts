import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { findMemberCurrentYearWorkloadRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from 'src/modules/session/transparence/domain/auto-affectation';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { NominationFileJurisdictionsFinder } from './nomination-file-jurisdictions.finder';
import { UnaffectedFilesFinder } from './unaffected-files.finder';

@Injectable()
export class AutoAffectationsFinder {
  readonly logger = new Logger(AutoAffectationsFinder.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService,
    private readonly unaffectedFilesFinder: UnaffectedFilesFinder,
    private readonly jurisdictionsFinder: NominationFileJurisdictionsFinder,
  ) {}

  async find(predicate: {
    tx?: Prisma.TransactionClient;
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
    excludedMemberIds: readonly string[] | undefined;
  }): Promise<AutoAffectations> {
    if (!predicate.tx) return this.prisma.$transaction((tx) => this.find({ ...predicate, tx }));

    const { tx } = predicate;

    const session = await tx.session.findUnique({
      where: { id: predicate.sessionId, deletedAt: null },
      select: {
        date: true,
        formation: true,
      },
    });

    if (!session) throw new NotFoundException();

    const nominationFiles = await this.unaffectedFilesFinder.find({
      tx,
      sessionId: predicate.sessionId,
      nominationFileIds: predicate.nominationFileIds,
    });

    const date = DateOnly.fromDate(session.date);
    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const members = await this.findMembers({
      tx,
      date,
      formation,
      sessionId: predicate.sessionId,
      excludedMemberIds: predicate.excludedMemberIds,
    });

    const jurisdictions = await this.jurisdictionsFinder.find({
      tx,
      nominationFileIds: nominationFiles.items.map(({ id }) => id),
    });

    const files = this.toAutoAffectationNominationFiles(
      nominationFiles.items.map((file) => {
        const { current = null, targeted = null } = jurisdictions.get(file.id) ?? {};
        return {
          ...file,
          currentJurisdiction: current?.id ?? null,
          targetedJurisdiction: targeted?.id ?? null,
        };
      }),
      { date, formation },
    );

    return AutoAffectations.from({
      files,
      members,
    });
  }

  private toAutoAffectationNominationFiles(
    nominationFiles: readonly {
      id: string;
      targetedGrade: string | null;
      currentJurisdiction: string | null;
      targetedJurisdiction: string | null;
      number: number | null;
    }[],
    session: { formation: FormationEnum; date: DateOnly },
  ): AutoAffectationNominationFile[] {
    return nominationFiles
      .map(({ id, number, targetedGrade, targetedJurisdiction, currentJurisdiction }) => {
        if (
          !isDefined(number) ||
          !isGrade(targetedGrade) ||
          (!currentJurisdiction && !targetedJurisdiction)
        ) {
          return null;
        }

        return AutoAffectationNominationFile.from({
          id,
          session,
          targetedGrade,
          number,
          currentJurisdiction,
          targetedJurisdiction,
        });
      })
      .filter(isDefined);
  }

  private async findMembers(session: {
    date: DateOnly;
    sessionId: string;
    formation: FormationEnum;
    excludedMemberIds: readonly string[] | undefined;
    tx?: Prisma.TransactionClient;
  }): Promise<AutoAffectationMember[]> {
    if (!session.tx) return this.prisma.$transaction((tx) => this.findMembers({ ...session, tx }));

    let memberIds = await this.membersService.findMembers({
      tx: session.tx,
      ids: undefined,
      formation: session.formation,
    });

    if (session.excludedMemberIds?.length) {
      const excluded = new Set(session.excludedMemberIds);
      memberIds = memberIds.filter((id) => !excluded.has(id));
    }

    if (memberIds.length === 0) return [];

    const [membersExcludedJurisdictions, memberYearlyWorkload] = [
      await session.tx.user.findMany({
        where: { id: { in: memberIds } },
        select: {
          id: true,
          excludedJurisdictionIds: {
            select: { jurisdictionId: true },
          },
        },
      }),

      await session.tx.$queryRawTyped(findMemberCurrentYearWorkloadRawQuery(memberIds, session.formation)),
    ];

    const affectationCountByMemberIdAndGrade = memberYearlyWorkload.reduce(
      (map, { targetedGrade, workload, reporterId }) => {
        if (!isGrade(targetedGrade)) return map;

        const byGrade = map.get(reporterId) ?? new Map();
        byGrade.set(targetedGrade, Number(workload));

        map.set(reporterId, byGrade);
        return map;
      },
      new Map<string, Map<GradeEnum, number>>(),
    );

    const excludedJurisdictionIdByMemberId = new Map(
      membersExcludedJurisdictions.map(
        (x) => [x.id, x.excludedJurisdictionIds.map(({ jurisdictionId }) => jurisdictionId)] as const,
      ),
    );

    return memberIds.map((id) => {
      const excludedJurisdictions = new Set<string>(excludedJurisdictionIdByMemberId.get(id) ?? []);
      const affectationCountPerGrade =
        affectationCountByMemberIdAndGrade.get(id) ?? new Map<GradeEnum, number>();

      return AutoAffectationMember.from({
        id,
        session,
        excludedJurisdictions,
        affectationCountPerGrade,
      });
    });
  }
}
