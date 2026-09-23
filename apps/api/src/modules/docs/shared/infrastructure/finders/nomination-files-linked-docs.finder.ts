import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
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
            version: {
              select: {
                status: true,
                sessionMeetingDate: true,
                agenda: { select: { id: true, officialReportId: true } },
              },
            },
          },
        },
        officialReportInclusions: {
          select: {
            outcome: true,
            version: {
              select: {
                status: true,
                officialReportId: true,
                validatedAt: true,
                sessionMeetingDate: true,
              },
            },
          },
        },
      } satisfies Prisma.DossierDeNominationSelect,
    });

    return new Map(
      nominationFiles.map((file) => {
        const byIds = new Map(
          speakingVersions(
            file.officialReportInclusions,
            (inclusion) => inclusion.version.officialReportId,
          ).map((x) => [x.version.officialReportId, x] as const),
        );
        const docs = speakingVersions(file.agendaInclusions, (inclusion) => inclusion.version.agenda.id).map(
          ({ version, outcome }) => {
            const { agenda } = version;
            const inclusion = agenda.officialReportId ? (byIds.get(agenda.officialReportId) ?? null) : null;

            return {
              agenda: { id: agenda.id, outcome: outcome, sessionMeetingDate: version.sessionMeetingDate },
              officialReport: inclusion
                ? {
                    id: inclusion.version.officialReportId,
                    isValidated: isDefined(inclusion.version.validatedAt),
                    outcome: inclusion.outcome,
                    sessionMeetingDate: inclusion.version.sessionMeetingDate,
                  }
                : null,
            };
          },
        );

        return [file.id, docs];
      }),
    );
  }
}

/**
 * a document holding a draft on top of its validated version carries the file twice, once per
 * version. Only one of them speaks for the document, and it is the validated one.
 */
function speakingVersions<T extends { version: { status: 'DRAFT' | 'VALIDATED' } }>(
  inclusions: readonly T[],
  documentIdOf: (inclusion: T) => string,
): T[] {
  const byDocument = new Map<string, T>();

  for (const inclusion of inclusions) {
    const kept = byDocument.get(documentIdOf(inclusion));
    if (!kept || inclusion.version.status === 'VALIDATED') {
      byDocument.set(documentIdOf(inclusion), inclusion);
    }
  }

  return [...byDocument.values()];
}
