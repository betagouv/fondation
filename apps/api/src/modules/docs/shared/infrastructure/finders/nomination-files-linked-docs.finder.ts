import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

export type NominationFileLinkedDoc = {
  agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null; sessionMeetingDate: Date };
  officialReport: {
    id: string;
    isValidated: boolean;
    outcome: DocNominationFileOutcomeEnum;
    sessionMeetingDate: Date;
  } | null;
};

@Injectable()
export class NominationFilesLinkedDocsFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(predicate: { nominationFileIds: Set<string> }): Promise<Map<string, NominationFileLinkedDoc[]>> {
    assertPgParams(predicate.nominationFileIds);

    const nominationFileIds = Array.from(predicate.nominationFileIds);

    const nominationFiles = await this.db.tx.dossierDeNomination.findMany({
      where: { id: { in: nominationFileIds } },
      select: {
        id: true,
        agendaInclusions: {
          select: {
            outcome: true,
            agenda: { select: { id: true, officialReportId: true, sessionMeetingDate: true } },
          },
        },
        officialReportInclusions: {
          select: {
            outcome: true,
            officialReportId: true,
            officialReport: { select: { pdfId: true, sessionMeetingDate: true } },
          },
        },
      },
    });

    return new Map(
      nominationFiles.map((file) => {
        const byIds = new Map(file.officialReportInclusions.map((x) => [x.officialReportId, x] as const));
        const docs = file.agendaInclusions.map(({ agenda, outcome }) => {
          const inclusion = agenda.officialReportId ? (byIds.get(agenda.officialReportId) ?? null) : null;

          return {
            agenda: { id: agenda.id, outcome: outcome, sessionMeetingDate: agenda.sessionMeetingDate },
            officialReport: inclusion
              ? {
                  id: inclusion.officialReportId,
                  isValidated: isDefined(inclusion.officialReport.pdfId),
                  outcome: inclusion.outcome,
                  sessionMeetingDate: inclusion.officialReport.sessionMeetingDate,
                }
              : null,
          };
        });

        return [file.id, docs];
      }),
    );
  }
}
