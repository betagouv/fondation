import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { NominationFileSnapshot } from '../../domain/nomination-file-snapshot';
import { Prisma } from 'src/generated/prisma/client';
import { DocsService } from 'src/modules/docs/docs.service';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class TransparenceFilesFinder {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  @Transactional()
  async bySessionAndFileNumber(query: {
    fileNumbers: readonly number[];
    sessionId: string;
  }): Promise<{ id: string; fileNumber: number }[]> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, number: true } satisfies Prisma.DossierDeNominationSelect,
      where: {
        number: { in: query.fileNumbers as number[] },
        sessionId: query.sessionId,
      },
    });

    return files
      .filter((x): x is { id: string; number: number } => isDefined(x.number))
      .map(({ id, number: fileNumber }) => ({ fileNumber, id }));
  }

  @Transactional()
  async findSnapshots(query: {
    nominationFileIds: Set<string> | undefined;
    sessionId: string;
  }): Promise<NominationFileSnapshot[]> {
    assertPgParams(query.nominationFileIds || []);

    const inIds =
      (query.nominationFileIds?.size ?? 0) > 0 ? { in: [...(query.nominationFileIds ?? [])] } : undefined;
    const snapshots = await this.db.tx.dossierDeNomination.findMany({
      select: {
        auditionDate: true,
        id: true,
        outcome: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: inIds, sessionId: query.sessionId },
    });

    const reportedFileIds = await this.docs.internalFindReportedNominationFiles({
      nominationFileIds: new Set(snapshots.map(({ id }) => id)),
    });

    return snapshots.map(({ auditionDate, id, outcome }) => ({
      auditionScheduled: auditionDate !== null,
      id,
      isReported: reportedFileIds.has(id),
      outcome,
    }));
  }
}
