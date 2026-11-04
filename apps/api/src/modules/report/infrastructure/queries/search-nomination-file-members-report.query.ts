import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { prismaReportStateEnumToReportState } from '../../../shared/mappers/rapport-statut.mapper';
import { memberReportState } from '../../domain/member-report-state';
import { MemberReportSchema } from '../dtos/report.dto';

@Injectable()
export class SearchNominationFileMembersReportQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
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

    const recusedFileIds = await this.sessions.internalFindFilesRecusedBy({
      memberId: query.userId,
      nominationFileIds: [query.nominationFileId],
    });
    const state = memberReportState(
      { state: prismaReportStateEnumToReportState(report.state) },
      { isRecused: recusedFileIds.has(query.nominationFileId) },
    );
    return { report: { id: report.id, state } };
  }
}

export class FoundNominationFileMembersReportDto extends createZodDto(
  z.object({ report: MemberReportSchema.nullable() }),
) {}
