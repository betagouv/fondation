import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { listMemberGardeDesSceauxSessions } from '../../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { Db } from '../../../../framework/database';
import { ReportService } from '../../../../report/report.service';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { noReportStates, type ReportStateCounts } from '../../../../shared/report-state.enum';
import { roleToFormation, type RoleEnum } from '../../../../shared/role.enum';
import type { TypeDeSaisineEnum } from '../../../../shared/type-de-saisine.enum';

@Injectable()
export class ListMemberSessionsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => ReportService))
    private readonly reports: ReportService,
  ) {}

  @Transactional()
  async handle(query: {
    typeDeSaisine: TypeDeSaisineEnum;
    user: { id: string; role: RoleEnum };
  }): Promise<ListedMemberSessionsDto> {
    const userFormationRestriction = roleToFormation(query.user.role) ?? null;
    const sessions = await this.db.tx.$queryRawTyped(
      listMemberGardeDesSceauxSessions(query.user.id, userFormationRestriction),
    );
    const reportCounts = await this.reports.internalCountMemberReportStates({
      reporterId: query.user.id,
      sessionIds: sessions.map(({ id }) => id),
    });

    const items = sessions.map((session) => ({
      date: DateOnly.fromUtcDate(session.date).toJson(),
      fileCount: Number(session.fileCount ?? 0),
      formation: prismaFormationEnumToFormationEnum(session.formation),
      id: session.id,
      isAffected: (session.reporterIds ?? []).length > 0,
      name: session.name,
      propositionCount: Number(session.propositionCount ?? 0),
      reportCounts: reportCounts.get(session.id) ?? noReportStates(),
    }));

    return { items };
  }
}

export class ListedMemberSessionsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        date: dateOnlyJsonSchema,
        fileCount: z.number(),
        formation: z.enum(FormationEnum),
        id: z.string(),
        isAffected: z.boolean(),
        name: z.string(),
        propositionCount: z.number(),
        reportCounts: z.object({
          IN_PROGRESS: z.number(),
          NEW: z.number(),
          READY_TO_SUPPORT: z.number(),
          SUPPORTED: z.number(),
        }) satisfies z.ZodType<ReportStateCounts>,
      }),
    ),
  }),
) {}
