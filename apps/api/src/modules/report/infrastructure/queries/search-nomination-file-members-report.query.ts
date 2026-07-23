import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class SearchNominationFileMembersReportQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<FoundNominationFileMembersReportDto> {
    const report = await this.prisma.report.findFirst({
      where: {
        isDeleted: false,
        nominationFileId: query.nominationFileId,
        reporterId: query.userId,
        sessionId: query.sessionId,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    return { reportId: report?.id ?? null };
  }
}

export class FoundNominationFileMembersReportDto extends createZodDto(
  z.object({ reportId: z.uuid().nullable() }),
) {}
