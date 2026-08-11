import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';

@Injectable()
export class ListMemberSessionReportsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { sessionId: string; userId: string }): Promise<ListedMemberSessionReportsDto> {
    const reports = await this.db.tx.report.findMany({
      where: {
        isDeleted: false,
        reporterId: query.userId,
        sessionId: query.sessionId,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, nominationFileId: true, state: true },
    });

    return {
      items: reports.map((report) => ({
        nominationFileId: report.nominationFileId,
        report: { id: report.id, state: prismaReportStateEnumToReportState(report.state) },
      })),
    };
  }
}

export class ListedMemberSessionReportsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        nominationFileId: z.uuid(),
        report: z.object({ id: z.uuid(), state: z.enum(ReportStateEnum) }),
      }),
    ),
  }),
) {}
