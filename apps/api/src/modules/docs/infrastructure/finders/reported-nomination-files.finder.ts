import { Injectable } from '@nestjs/common';

import { ReportedNominationFilesCollection } from '../../domain/reported-nomination-files-collection';
import { Prisma } from 'src/generated/prisma/client';
import { findReportedInAgendaNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class ReportedNominationFilesFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findReportedInAgendas(query: {
    tx?: Prisma.TransactionClient;
    fileIds: Set<string>;
    ignoreAgendaId?: string;
  }): Promise<ReportedNominationFilesCollection> {
    if (!query.tx) {
      return this.prisma.$transaction((tx) => this.findReportedInAgendas({ ...query, tx }));
    }

    const reports = await query.tx.$queryRawTyped(
      findReportedInAgendaNominationFilesRawQuery([...query.fileIds], query.ignoreAgendaId ?? null),
    );

    return ReportedNominationFilesCollection.from({
      reports: reports
        .filter((file) => ReportedNominationFilesFinder.hasNominationFileId(file))
        .map(({ agendaId, ...file }) => ({ reportedIn: agendaId, ...file })),
    });
  }

  private static hasNominationFileId<T extends { nominationFileId: string | null }>(
    file: T,
  ): file is T & { nominationFileId: string } {
    return isDefined(file.nominationFileId);
  }
}
