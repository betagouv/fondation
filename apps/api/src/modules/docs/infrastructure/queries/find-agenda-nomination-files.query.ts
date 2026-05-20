import { Injectable } from '@nestjs/common';

import { DocsNominationFilesFinder, FoundDocsNominationFiles } from '../finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from '../finders/reported-nomination-files.finder';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class FindAgendaNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nominationFilesFinder: DocsNominationFilesFinder,
    private readonly reportedNominationFilesFinder: ReportedNominationFilesFinder,
  ) {}

  async handle(query: { sessionId: string; ignoreAgendaId?: string }): Promise<FoundDocsNominationFiles> {
    const { files, reported } = await this.prisma.$transaction(async (tx) => {
      const { items: files } = await this.nominationFilesFinder.find({
        tx,
        sessionId: query.sessionId,
      });

      const reported = await this.reportedNominationFilesFinder.findReportedInAgendas({
        tx,
        fileIds: new Set(files.map(({ id }) => id)),
        ignoreAgendaId: query.ignoreAgendaId,
      });

      return { files, reported };
    });

    return {
      items: files.filter(
        (file) => !reported.wasFileReported({ ignore: query.ignoreAgendaId, fileId: file.id }),
      ),
    };
  }
}
