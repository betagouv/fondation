import { Injectable, NotFoundException } from '@nestjs/common';
import { NominationFile, Role, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import {
  paginate,
  Paginated,
  Pagination,
} from 'src/modules/framework/pagination';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import {
  prismaReportStateEnumToReportState,
  reportStateToPrismaReportStateEnum,
} from 'src/modules/shared/mappers/rapport-statut.mapper';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertIsDefined } from 'src/utils/is-defined';
import type { ReportSortField } from '../dtos/member-session-reports.dto';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class ListMemberSessionReportsQuery {
  constructor(
    private readonly prisma: PrismaService,
    private versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    user: { id: string; role: Role };
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
    pagination: Pagination;
    filters: { states: readonly NominationFile.ReportState[] };
    sort: { field: ReportSortField | undefined; direction: 'asc' | 'desc' };
  }): Promise<Paginated<MemberSessionReportDto>> {
    const { items, totalCount } = await this.prisma.$transaction(async (tx) => {
      const version = await this.versionFinder.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

      if (!version) throw new NotFoundException();

      const formation = roleToFormation(query.user.role);

      const statesFilter =
        query.filters.states.length > 0
          ? {
              state: {
                in: query.filters.states.map(
                  reportStateToPrismaReportStateEnum,
                ),
              },
            }
          : {};

      const baseWhere = {
        sessionId: query.sessionId,
        session: { formation, typeDeSaisine: query.typeDeSaisine },
        reporterIds: {
          some: { versionId: version.id, userId: query.user.id },
        },
        reports: {
          some: {
            reporterId: query.user.id,
            ...statesFilter,
          },
        },
      };

      const totalCount = await tx.dossierDeNomination.count({
        where: baseWhere,
      });

      const orderBy = this.buildOrderBy(query.sort.field, query.sort.direction);

      const dossiers = await tx.dossierDeNomination.findMany({
        where: baseWhere,
        orderBy,
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        include: {
          session: {
            select: { formation: true },
          },
          reports: {
            take: 1,
            select: { id: true, state: true },
            where: { reporterId: query.user.id },
          },
        },
      });

      const items = dossiers.map((d): MemberSessionReportDto => {
        const report = assertIsDefined(d.reports[0]);
        return {
          id: report.id,
          state: prismaReportStateEnumToReportState(report.state),
          formation: prismaFormationEnumToFormationEnum(d.session.formation),
          folderNumber: d.number,
          dueDate: null,
          name: d.name ?? '',
          grade: d.grade ?? '',
          targettedPosition: d.targetedPosition ?? '',
          observers: d.observers,
        };
      });

      return { items, totalCount };
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private buildOrderBy(
    field: ReportSortField | undefined,
    direction: 'asc' | 'desc',
  ): Record<string, 'asc' | 'desc'> {
    if (!field) return { number: 'asc' };

    const fieldMapping: Record<ReportSortField, string> = {
      folderNumber: 'number',
      name: 'name',
      grade: 'grade',
      targettedPosition: 'targetedPosition',
      state: 'number', // state sorting on nested relation not supported, fallback to number
    };

    return { [fieldMapping[field]]: direction };
  }
}

export type MemberSessionReportDto = {
  id: string;
  state: NominationFile.ReportState;
  formation: string;
  folderNumber: number | null;
  dueDate: null;
  name: string;
  grade: string;
  targettedPosition: string;
  observers: string[];
};
