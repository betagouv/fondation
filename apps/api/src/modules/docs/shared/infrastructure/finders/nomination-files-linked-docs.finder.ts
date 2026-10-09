import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

export type NominationFileLinkedDoc = {
  agenda: { sessionMeetingDate: Date };
  officialReport: { isValidated: boolean; sessionMeetingDate: Date } | null;
};

@Injectable()
export class NominationFilesLinkedDocsFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(predicate: { nominationFileIds: Set<string> }): Promise<Map<string, NominationFileLinkedDoc[]>> {
    assertPgParams(predicate.nominationFileIds);

    const nominationFileIds = Array.from(predicate.nominationFileIds);

    const agendaInclusions = await this.db.tx.agendaNominationFile.findMany({
      select: {
        nominationFileId: true,
        version: {
          select: {
            agenda: { select: { id: true, officialReportId: true } },
            sessionMeetingDate: true,
            status: true,
          },
        },
      } satisfies Prisma.AgendaNominationFileSelect,
      where: { nominationFileId: { in: nominationFileIds } },
    });
    const officialReportInclusions = await this.db.tx.officialReportNominationFile.findMany({
      select: {
        nominationFileId: true,
        version: {
          select: { officialReportId: true, sessionMeetingDate: true, status: true, validatedAt: true },
        },
      } satisfies Prisma.OfficialReportNominationFileSelect,
      where: { nominationFileId: { in: nominationFileIds } },
    });

    const agendaInclusionsByFileId = Map.groupBy(
      agendaInclusions,
      ({ nominationFileId }) => nominationFileId,
    );
    const officialReportInclusionsByFileId = Map.groupBy(
      officialReportInclusions,
      ({ nominationFileId }) => nominationFileId,
    );

    return new Map(
      nominationFileIds.map((nominationFileId) => {
        const byIds = new Map(
          speakingVersions(
            officialReportInclusionsByFileId.get(nominationFileId) ?? [],
            (inclusion) => inclusion.version.officialReportId,
          ).map((x) => [x.version.officialReportId, x] as const),
        );
        const docs = speakingVersions(
          agendaInclusionsByFileId.get(nominationFileId) ?? [],
          (inclusion) => inclusion.version.agenda.id,
        ).map(({ version }) => {
          const { agenda } = version;
          const inclusion = agenda.officialReportId ? (byIds.get(agenda.officialReportId) ?? null) : null;

          return {
            agenda: { sessionMeetingDate: version.sessionMeetingDate },
            officialReport: inclusion
              ? {
                  isValidated: isDefined(inclusion.version.validatedAt),
                  sessionMeetingDate: inclusion.version.sessionMeetingDate,
                }
              : null,
          };
        });

        return [nominationFileId, docs];
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
