import { Injectable } from '@nestjs/common';

import { ReportedNominationFileCollection } from '../../domain/reported-nomination-file-collection';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class ReportedNominationFilesFinder {
  constructor(private readonly prisma: PrismaService) {}

  async find(query: {
    fileIds: Set<string>;
    ignoreOfficialReportId?: string;
    tx?: Prisma.TransactionClient;
  }): Promise<ReportedNominationFileCollection> {
    assertPgParams(query.fileIds);

    if (!query.tx) return this.prisma.$transaction((tx) => this.find({ ...query, tx }));

    const files = await query.tx.officialReportNominationFile.findMany({
      where: {
        nominationFileId: { in: [...query.fileIds] },
        officialReportId: { not: query.ignoreOfficialReportId },
      },
      select: { nominationFileId: true, officialReportId: true, outcome: true },
    });

    return ReportedNominationFileCollection.from(
      files.map((f) => ({
        outcome: f.outcome,
        officialReportId: f.officialReportId,
        nominationFileId: assertIsDefined(f.nominationFileId, `nomination file was deleted`),
      })),
    );
  }
}
