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
      orderBy: [
        { nominationFile: { number: { sort: 'asc', nulls: 'last' } } },
        { nominationFile: { name: 'asc' } },
      ],
      select: {
        id: true,
        nominationFileId: true,
        state: true,
        nominationFile: { select: { name: true, number: true } },
      },
    });

    return {
      items: reports.map((report) => ({
        name: report.nominationFile.name,
        nominationFileId: report.nominationFileId,
        number: report.nominationFile.number,
        report: { id: report.id, state: prismaReportStateEnumToReportState(report.state) },
      })),
    };
  }
}

export class ListedMemberSessionReportsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        name: z.string(),
        nominationFileId: z.uuid(),
        number: z.number().int().nullable(),
        report: z.object({ id: z.uuid(), state: z.enum(ReportStateEnum) }),
      }),
    ),
  }),
) {}
