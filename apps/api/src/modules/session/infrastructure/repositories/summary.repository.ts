import { Injectable, NotFoundException } from '@nestjs/common';

import {
  AttachedFilesToSummary,
  DetachedFilesFromSummary,
  IncludedFilesInSummaryContent,
  Summary,
  SummaryContentWritten,
  SummaryCreated,
  UpdatedSummaryReaderList,
} from '../../domain/summary';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class SummaryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async exists(query: { sessionId: string; nominationFileId: string }): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        dossierDeNominations: {
          take: 1,
          where: { id: query.nominationFileId },
          select: { summary: { select: { nominationFileId: true } } },
        },
      },
    });

    return !!session?.dossierDeNominations[0]?.summary;
  }

  // TODO: should we rehydrate files with outcomes?
  async find(query: { sessionId: string; nominationFileId: string }) {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        dossierDeNominations: {
          where: { id: query.nominationFileId },
          select: {
            summary: {
              select: { nominationFileId: true, authorId: true },
            },
          },
        },
      },
    });

    const summary = session?.dossierDeNominations[0]?.summary;
    if (!isDefined(summary)) throw new NotFoundException();

    return Summary.from({
      id: summary.nominationFileId,
      authorId: summary.authorId,
    });
  }

  persist(summary: Summary) {
    return this.prisma.$transaction(async (tx) => {
      for (const message of summary.messages) {
        if (message instanceof SummaryCreated) await this.persistSummaryCreated(tx, message);
        else if (message instanceof AttachedFilesToSummary)
          await this.persistAttachedFilesToSummary(tx, message);
        else if (message instanceof DetachedFilesFromSummary)
          await this.persistDetachedFilesFromSummary(tx, message);
        else if (message instanceof IncludedFilesInSummaryContent)
          await this.persistIncludedFilesInSummaryContent(tx, message);
        else if (message instanceof SummaryContentWritten)
          await this.persistSummaryContentWritten(tx, message);
        else if (message instanceof UpdatedSummaryReaderList)
          await this.persistUpdatedSummaryReaderList(tx, message);
        else assertNever(message);
      }
    });
  }

  private persistSummaryCreated(tx: Prisma.TransactionClient, message: SummaryCreated) {
    return tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: {
        summary: { create: { content: '', authorId: message.authorId } },
      },
    });
  }

  private persistAttachedFilesToSummary(tx: Prisma.TransactionClient, message: AttachedFilesToSummary) {
    return tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        attachments: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private async persistDetachedFilesFromSummary(
    tx: Prisma.TransactionClient,
    message: DetachedFilesFromSummary,
  ) {
    await tx.summaryAttachment.deleteMany({
      where: {
        summaryId: message.id,
        fileId: { in: message.fileIds as string[] },
      },
    });

    const files = await tx.file.findMany({
      select: { id: true, path: true },
      where: { id: { in: message.fileIds as string[] } },
    });

    this.files.delete(files);
  }

  private persistIncludedFilesInSummaryContent(
    tx: Prisma.TransactionClient,
    message: IncludedFilesInSummaryContent,
  ) {
    return tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        screenshots: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private persistSummaryContentWritten(tx: Prisma.TransactionClient, message: SummaryContentWritten) {
    return tx.summary.update({
      where: { nominationFileId: message.id },
      data: { content: message.content },
    });
  }

  private persistUpdatedSummaryReaderList(tx: Prisma.TransactionClient, message: UpdatedSummaryReaderList) {
    return tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        readers: {
          deleteMany: {},
          createMany: { data: message.readerIds.map((userId) => ({ userId })) },
        },
      },
    });
  }
}
