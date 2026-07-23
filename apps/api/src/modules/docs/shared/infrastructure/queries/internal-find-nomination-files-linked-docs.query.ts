import { Injectable } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class InternalFindNominationFilesLinkedDocsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    tx?: Prisma.TransactionClient;
    nominationFileIds: Set<string>;
  }): Promise<InternalFoundNominationFilesLinkedDocsDto> {
    assertPgParams(query.nominationFileIds);

    if (!query.tx) {
      return this.prisma.$transaction(async (tx) => this.handle({ ...query, tx }));
    }

    const nominationFileIds = Array.from(query.nominationFileIds);

    const nominationFiles = await query.tx.dossierDeNomination.findMany({
      where: { id: { in: nominationFileIds } },
      select: {
        id: true,
        agendaInclusions: {
          select: { outcome: true, agenda: { select: { id: true, officialReportId: true } } },
        },
        officialReportInclusions: { select: { outcome: true, officialReportId: true } },
      },
    });

    const items = new Map(
      nominationFiles.map((file) => {
        const byIds = new Map(file.officialReportInclusions.map((x) => [x.officialReportId, x] as const));
        const docs = file.agendaInclusions.map(({ agenda, outcome }) => {
          const officialReport = agenda.officialReportId
            ? (byIds.get(agenda.officialReportId) ?? null)
            : null;

          return {
            agenda: { id: agenda.id, outcome: outcome },
            officialReport: officialReport
              ? { id: officialReport.officialReportId, outcome: officialReport.outcome }
              : null,
          };
        });

        return [file.id, docs];
      }),
    );

    return { items };
  }
}

export type InternalFoundNominationFilesLinkedDocsDto = {
  items: Map<
    string,
    {
      agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null };
      officialReport: { id: string; outcome: DocNominationFileOutcomeEnum } | null;
    }[]
  >;
};
