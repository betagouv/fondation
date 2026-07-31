import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class InternalFindNominationFilesLinkedDocsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    nominationFileIds: Set<string>;
  }): Promise<InternalFoundNominationFilesLinkedDocsDto> {
    assertPgParams(query.nominationFileIds);

    const nominationFileIds = Array.from(query.nominationFileIds);

    const nominationFiles = await this.db.tx.dossierDeNomination.findMany({
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
