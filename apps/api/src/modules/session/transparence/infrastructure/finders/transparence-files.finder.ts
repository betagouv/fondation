import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { NominationFileDocsSnapshot } from '../../../shared/types/nomination-file';
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
    sessionId: string;
    fileNumbers: readonly number[];
  }): Promise<{ id: string; fileNumber: number }[]> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      where: {
        sessionId: query.sessionId,
        number: { in: query.fileNumbers as number[] },
      },
      select: { id: true, number: true },
    });

    return files
      .filter((x): x is { id: string; number: number } => isDefined(x.number))
      .map(({ id, number: fileNumber }) => ({ id, fileNumber }));
  }

  @Transactional()
  async findDocsSnapshots(query: {
    sessionId: string;
    nominationFileIds: Set<string> | undefined;
  }): Promise<NominationFileDocsSnapshot[]> {
    assertPgParams(query.nominationFileIds || []);

    const inIds =
      (query.nominationFileIds?.size ?? 0) > 0 ? { in: [...(query.nominationFileIds ?? [])] } : undefined;
    const snapshots = await this.db.tx.dossierDeNomination.findMany({
      where: { id: inIds, sessionId: query.sessionId },
      select: {
        id: true,
        outcome: true,
      },
    });

    const withDocs = await this.docs.internalFindNominationFilesLinkedDocs({
      nominationFileIds: new Set(snapshots.map(({ id }) => id)),
    });

    return snapshots.map((file) => {
      const docs = withDocs.get(file.id) ?? [];
      return { ...file, docs };
    });
  }
}
