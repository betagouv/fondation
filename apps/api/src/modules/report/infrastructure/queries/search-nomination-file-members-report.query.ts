import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { prismaReportStateEnumToReportState } from '../../../shared/mappers/rapport-statut.mapper';
import { MemberReportSchema } from '../dtos/report.dto';

@Injectable()
export class SearchNominationFileMembersReportQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<FoundNominationFileMembersReportDto> {
    const report = await this.db.tx.report.findFirst({
      where: {
        isDeleted: false,
        nominationFileId: query.nominationFileId,
        reporterId: query.userId,
        sessionId: query.sessionId,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, state: true } satisfies Prisma.ReportSelect,
    });
    if (!report) return { report: null };

    return { report: { id: report.id, state: prismaReportStateEnumToReportState(report.state) } };
  }
}

export class FoundNominationFileMembersReportDto extends createZodDto(
  z.object({ report: MemberReportSchema.nullable() }),
) {}
