import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import {
  AttachedFilesToSummary,
  DetachedFilesFromSummary,
  IncludedFilesInSummaryContent,
  Summary,
  SummaryContentWritten,
  SummaryCreated,
  UpdatedSummaryReaderList,
} from 'src/modules/session/summaries/domain/summary';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class SummaryRepository {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async find(query: { sessionId: string; nominationFileId: string }) {
    const session = await this.db.tx.session.findUnique({
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

  @Transactional(Propagation.Mandatory)
  async persist(summary: Summary) {
    for (const message of summary.messages) {
      if (message instanceof SummaryCreated) await this.persistSummaryCreated(message);
      else if (message instanceof AttachedFilesToSummary) await this.persistAttachedFilesToSummary(message);
      else if (message instanceof DetachedFilesFromSummary)
        await this.persistDetachedFilesFromSummary(message);
      else if (message instanceof IncludedFilesInSummaryContent)
        await this.persistIncludedFilesInSummaryContent(message);
      else if (message instanceof SummaryContentWritten) await this.persistSummaryContentWritten(message);
      else if (message instanceof UpdatedSummaryReaderList)
        await this.persistUpdatedSummaryReaderList(message);
      else assertNever(message);
    }
  }

  private persistSummaryCreated(message: SummaryCreated) {
    return this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: {
        summary: { upsert: { create: { content: '' }, update: {} } },
      },
    });
  }

  private persistAttachedFilesToSummary(message: AttachedFilesToSummary) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        attachments: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private async persistDetachedFilesFromSummary(message: DetachedFilesFromSummary) {
    await this.db.tx.summaryAttachment.deleteMany({
      where: {
        summaryId: message.id,
        fileId: { in: message.fileIds as string[] },
      },
    });

    const files = await this.db.tx.file.findMany({
      select: { id: true, path: true },
      where: { id: { in: message.fileIds as string[] } },
    });

    this.files.delete(files);
  }

  private persistIncludedFilesInSummaryContent(message: IncludedFilesInSummaryContent) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        screenshots: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private persistSummaryContentWritten(message: SummaryContentWritten) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        content: message.content,
        ...(message.newAuthorId ? { authorId: message.newAuthorId } : {}),
      },
    });
  }

  private persistUpdatedSummaryReaderList(message: UpdatedSummaryReaderList) {
    return this.db.tx.summary.update({
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
