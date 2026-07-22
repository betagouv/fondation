import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { NominationFileDocsSnapshot } from '../../../shared/types/nomination-file';
import { Prisma } from 'src/generated/prisma/client';
import { DocsService } from 'src/modules/docs/docs.service';
import { PrismaService } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class TransparenceFilesFinder {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  async bySessionAndFileNumber(query: {
    sessionId: string;
    fileNumbers: readonly number[];
    tx?: Prisma.TransactionClient;
  }): Promise<{ id: string; fileNumber: number }[]> {
    if (!query.tx) {
      return this.prisma.$transaction((tx) => this.bySessionAndFileNumber({ ...query, tx }));
    }

    const files = await query.tx.dossierDeNomination.findMany({
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

  async findDocsSnapshots(query: {
    sessionId: string;
    nominationFileIds: Set<string> | undefined;
    tx?: Prisma.TransactionClient;
  }): Promise<NominationFileDocsSnapshot[]> {
    if (!query.tx) {
      return this.prisma.$transaction((tx) => this.findDocsSnapshots({ ...query, tx }));
    }

    assertPgParams(query.nominationFileIds || []);

    const inIds =
      (query.nominationFileIds?.size ?? 0) > 0 ? { in: [...(query.nominationFileIds ?? [])] } : undefined;
    const snapshots = await query.tx.dossierDeNomination.findMany({
      where: { id: inIds, sessionId: query.sessionId },
      select: {
        id: true,
        outcome: true,
      },
    });

    const { items: withDocs } = await this.docs.internalFindNominationFilesLinkedDocs({
      tx: query.tx,
      nominationFileIds: new Set(snapshots.map(({ id }) => id)),
    });

    return snapshots.map((file) => {
      const docs = withDocs.get(file.id) ?? [];
      return { ...file, docs };
    });
  }
}
