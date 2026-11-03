import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { prismaReportStateEnumToReportState } from '../../../shared/mappers/rapport-statut.mapper';
import type { RoleEnum } from '../../../shared/role.enum';
import { memberReportState } from '../../domain/member-report-state';
import { MemberReportSchema } from '../dtos/report.dto';

@Injectable()
export class ListMemberSessionReportsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: {
    sessionId: string;
    user: { id: string; role: RoleEnum };
  }): Promise<ListedMemberSessionReportsDto> {
    await this.sessions.assertMemberSessionExists({
      sessionId: query.sessionId,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      user: query.user,
    });

    const reports = await this.db.tx.report.findMany({
      select: { id: true, nominationFileId: true, state: true } satisfies Prisma.ReportSelect,
      where: { isDeleted: false, reporterId: query.user.id, sessionId: query.sessionId },
    });
    const nominationFileIds = reports.map(({ nominationFileId }) => nominationFileId);
    const files = await this.sessions.internalFindNominationFilesByIds({ nominationFileIds });
    const recusedFileIds = await this.sessions.internalFindFilesRecusedBy({
      memberId: query.user.id,
      nominationFileIds,
    });

    const items = reports.flatMap((report) => {
      const file = files.get(report.nominationFileId);
      if (!file) return [];

      const state = memberReportState(
        { state: prismaReportStateEnumToReportState(report.state) },
        { isRecused: recusedFileIds.has(report.nominationFileId) },
      );
      return [
        {
          name: file.name,
          nominationFileId: report.nominationFileId,
          number: file.number,
          report: { id: report.id, state },
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
        report: MemberReportSchema,
      }),
    ),
  }),
) {}
