import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';

@Injectable()
export class ListMemberSessionReportsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string; userId: string }): Promise<ListedMemberSessionReportsDto> {
    const reports = await this.db.tx.report.findMany({
      select: { id: true, nominationFileId: true, state: true } satisfies Prisma.ReportSelect,
      where: { isDeleted: false, reporterId: query.userId, sessionId: query.sessionId },
    });
    const files = await this.sessions.internalFindNominationFilesByIds({
      nominationFileIds: reports.map(({ nominationFileId }) => nominationFileId),
    });

    const items = reports.flatMap((report) => {
      const file = files.get(report.nominationFileId);
      if (!file) return [];

      return [
        {
          name: file.name,
          nominationFileId: report.nominationFileId,
          number: file.number,
          report: { id: report.id, state: prismaReportStateEnumToReportState(report.state) },
        },
      ];
    });

    // a member reports on a few dozen files at most: the order is set here, numbered files first
    return {
      items: items.toSorted(
        (a, b) =>
          (a.number ?? Number.POSITIVE_INFINITY) - (b.number ?? Number.POSITIVE_INFINITY) ||
          a.name.localeCompare(b.name),
      ),
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
