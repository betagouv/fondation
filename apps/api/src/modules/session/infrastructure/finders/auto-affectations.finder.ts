import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Magistrat } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { findMemberCurrentYearWorkloadRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from 'src/modules/session/domain/auto-affectation';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { UnaffectedFilesFinder } from './unaffected-files.finder';

@Injectable()
export class AutoAffectationsFinder {
  readonly logger = new Logger(AutoAffectationsFinder.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService,
    private readonly unaffectedFilesFinder: UnaffectedFilesFinder,
  ) {}

  async find(predicate: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
    excludedMemberIds: readonly string[] | undefined;
  }): Promise<AutoAffectations> {
    const session = await this.prisma.$transaction(async (tx) => {
      const txSession = await tx.session.findUnique({
        where: { id: predicate.sessionId, deletedAt: null },
        select: {
          date: true,
          formation: true,
        },
      });

      if (!txSession) return null;

      const nominationFiles = await this.unaffectedFilesFinder.find({
        tx,
        sessionId: predicate.sessionId,
        nominationFileIds: predicate.nominationFileIds,
      });

      return {
        ...txSession,
        dossierDeNominations: await this.withJurisdiction(tx, nominationFiles.items),
      };
    });

    if (!session) throw new NotFoundException();

    const date = DateOnly.fromDate(session.date);
    const formation = prismaFormationEnumToFormationEnum(session.formation);

    const members = await this.findMembers({
      date,
      formation,
      sessionId: predicate.sessionId,
      excludedMemberIds: predicate.excludedMemberIds,
    });
    const files = this.toAutoAffectationNominationFiles(session.dossierDeNominations, {
      date,
      formation,
    });

    return AutoAffectations.from({
      files,
      members,
    });
  }

  private toAutoAffectationNominationFiles(
    nominationFiles: readonly {
      id: string;
      targetedPosition: string | null;
      targetedGrade: string | null;
      currentJurisdiction: string | null;
      targetedJurisdiction: string | null;
      number: number | null;
    }[],
    session: { formation: Magistrat.Formation; date: DateOnly },
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
    formation: Magistrat.Formation;
    excludedMemberIds: readonly string[] | undefined;
  }): Promise<AutoAffectationMember[]> {
    let memberIds = await this.membersService.findMembers({
      ids: undefined,
      formation: session.formation,
    });

    if (session.excludedMemberIds?.length) {
      const excluded = new Set(session.excludedMemberIds);
      memberIds = memberIds.filter((id) => !excluded.has(id));
    }

    if (memberIds.length === 0) return [];

    const [membersExcludedJurisdictions, memberYearlyWorkload] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: {
          id: true,
          excludedJurisdictionIds: {
            select: { jurisdictionId: true },
          },
        },
      }),

      this.prisma.$queryRawTyped(findMemberCurrentYearWorkloadRawQuery(memberIds, session.formation)),
    ]);

    const affectationCountByMemberIdAndGrade = memberYearlyWorkload.reduce(
      (map, { targetedGrade, workload, reporterId }) => {
        if (!isGrade(targetedGrade)) return map;

        const byGrade = map.get(reporterId) ?? new Map();
        byGrade.set(targetedGrade, Number(workload));

        map.set(reporterId, byGrade);
        return map;
      },
      new Map<string, Map<Magistrat.Grade, number>>(),
    );

    const excludedJurisdictionIdByMemberId = new Map(
      membersExcludedJurisdictions.map(
        (x) => [x.id, x.excludedJurisdictionIds.map(({ jurisdictionId }) => jurisdictionId)] as const,
      ),
    );

    return memberIds.map((id) => {
      const excludedJurisdictions = new Set<string>(excludedJurisdictionIdByMemberId.get(id) ?? []);
      const affectationCountPerGrade =
        affectationCountByMemberIdAndGrade.get(id) ?? new Map<Magistrat.Grade, number>();

      return AutoAffectationMember.from({
        id,
        session,
        excludedJurisdictions,
        affectationCountPerGrade,
      });
    });
  }

  private async withJurisdiction<
    T extends {
      id: string;
      currentPosition: string | null;
      targetedPosition: string | null;
    },
  >(
    tx: Prisma.TransactionClient,
    positions: readonly T[],
  ): Promise<
    (T & {
      targetedJurisdiction: string | null;
      currentJurisdiction: string | null;
    })[]
  > {
    const result = await tx.$queryRaw<{ id: string; current: string | null; target: string | null }[]>`
      WITH queried_positions AS (
        SELECT
          (p.content ->> 'id')::UUID AS id,
          (p.content ->> 'currentPosition') AS current_position,
          (p.content ->> 'targetedPosition') AS targeted_position
        FROM UNNEST (${positions}::jsonb[]) AS p(content)
      )

      SELECT queried_positions.id, current_j.codejur AS "current", target_j.codejur AS "target"
      FROM queried_positions
        LEFT JOIN data_administration_context.jurisdictions current_j
          ON (
            queried_positions.current_position IS NOT NULL
            AND queried_positions.current_position ILIKE '%' || current_j.codejur || '%'
          )
        LEFT JOIN data_administration_context.jurisdictions target_j
          ON (
            queried_positions.targeted_position IS NOT NULL
            AND queried_positions.targeted_position ILIKE '%' || target_j.codejur || '%'
          )
    `;

    const byId = new Map(result.map((p) => [p.id, p]));
    return positions.map((position) => {
      const { current = null, target = null } = byId.get(position.id) ?? {};
      return {
        ...position,
        currentJurisdiction: current,
        targetedJurisdiction: target,
      };
    });
  }
}
