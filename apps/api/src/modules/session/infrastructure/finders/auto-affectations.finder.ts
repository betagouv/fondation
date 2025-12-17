import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { startOfYear } from 'date-fns';
import { Magistrat } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { isDefined } from 'src/utils/is-defined';

import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from 'src/modules/session/domain/auto-affectations';
import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class AutoAffectationsFinder {
  readonly logger = new Logger(AutoAffectationsFinder.name);

  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
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

      const txSession = await tx.session.findUnique({
        where: { id: predicate.sessionId },
        select: {
          date: true,
          formation: true,
          dossierDeNominations: {
            select: { id: true, targetedPosition: true, targetedGrade: true },
            where: {
              id: { in: predicate.nominationFileIds as string[] },
              reporterIds: {
                none: { versionId: version?.id },
              },
            },
          },
        },
      });

      if (!txSession) return null;

      return {
        ...txSession,
        dossierDeNominations: await this.withJurisdiction(
          tx,
          txSession.dossierDeNominations,
        ),
      };
    });

    if (!session) throw new NotFoundException();

    const date = DateOnly.fromDate(session.date);
    const formation = prismaFormationEnumToFormationEnum(session.formation);

    const members = await this.findMembers({ date, formation });
    const files = this.toAutoAffectationNominationFiles(
      session.dossierDeNominations,
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
      targetedPosition: string | null;
      targetedGrade: string | null;
      jurisdiction: string | null;
    }[],
    session: { formation: Magistrat.Formation; date: DateOnly },
  ): AutoAffectationNominationFile[] {
    return nominationFiles
      .map(({ id, targetedGrade, jurisdiction }) => {
        if (!jurisdiction || !isGrade(targetedGrade)) return null;

        return AutoAffectationNominationFile.from({
          id,
          session,
          targetedGrade: targetedGrade,
          targetJurisdiction: jurisdiction,
        });
      })
      .filter(isDefined);
  }

  private async findMembers(session: {
    date: DateOnly;
    formation: Magistrat.Formation;
  }): Promise<AutoAffectationMember[]> {
    const memberIds = await this.membersService.findMembers({
      ids: undefined,
      formation: session.formation,
    });

    if (memberIds.length === 0) return [];

    type ReportCount = {
      reporterId: string;
      targetedGrade: string | null;
      reportCount: Prisma.Decimal;
    };
    const [membersExcludedJurisdictions, reportCounts] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: {
            id: true,
            excludedJurisdictionIds: {
              select: { jurisdictionId: true },
            },
          },
        }),

        this.prisma.$queryRaw<ReportCount[]>`
          SELECT
            r.reporter_id AS "reporterId",
            ddn.targeted_grade AS "targetedGrade",
            COUNT(r.id) AS "reportCount"
          FROM reports_context.reports r
            INNER JOIN nominations_context.dossier_de_nomination ddn ON r.nomination_file_id = ddn.id
          WHERE (
            NOT r.is_deleted
            AND r.reporter_id = ANY(${memberIds}::UUID[])
            AND r.created_at >= ${startOfYear(this.clock.now())}::DATE
          )
          GROUP BY r.reporter_id, ddn.targeted_grade;
        `,
      ]);

    const reportCountByMemberIdAndGrade = reportCounts.reduce(
      (map, { targetedGrade, reportCount, reporterId }) => {
        if (!isGrade(targetedGrade)) return map;

        const byGrade = map.get(reporterId) ?? new Map();
        byGrade.set(targetedGrade, Number(reportCount));

        map.set(reporterId, byGrade);
        return map;
      },
      new Map<string, Map<Magistrat.Grade, number>>(),
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
      const pastReportCountPerGrade =
        reportCountByMemberIdAndGrade.get(id) ??
        new Map<Magistrat.Grade, number>();

      return AutoAffectationMember.from({
        id,
        session,
        excludedJurisdictions,
        pastReportCountPerGrade,
      });
    });
  }

  private async withJurisdiction<
    T extends { id: string; targetedPosition: string | null },
  >(
    tx: Prisma.TransactionClient,
    positions: readonly T[],
  ): Promise<(T & { jurisdiction: string | null })[]> {
    const definedPositions = positions.filter(
      (p): p is T & { targetedPosition: string } =>
        isDefined(p.targetedPosition),
    );

    const result = await tx.$queryRaw<{ id: string; codejur: string }[]>`
      WITH queried_positions AS (
        SELECT
          (p.content ->> 'id')::UUID AS id,
          (p.content ->> 'targetedPosition') AS targeted_position
        FROM UNNEST (${definedPositions}::jsonb[]) AS p(content)
      )

      SELECT queried_positions.id, codejur
      FROM queried_positions
        INNER JOIN data_administration_context.jurisdictions j
          ON queried_positions.targeted_position ILIKE '%' || j.codejur || '%'
    `;

    const byId = new Map(result.map((p) => [p.id, p.codejur]));
    return positions.map((position) => ({
      ...position,
      jurisdiction: byId.get(position.id) || null,
    }));
  }
}
